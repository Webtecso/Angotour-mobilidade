import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { SavedPlace } from '../types';
import { defaultOrigin } from '../services/mockData';

interface LocationContextValue {
  currentPlace: SavedPlace;
  isLoading: boolean;
  permissionDenied: boolean;
  refresh: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

async function resolvePlaceFromCoords(latitude: number, longitude: number): Promise<SavedPlace> {
  try {
    const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = result
      ? [result.street, result.district ?? result.city].filter(Boolean).join(', ')
      : 'Localizacao atual';

    return {
      id: 'origin-current',
      kind: 'custom',
      label: 'A minha localizacao',
      address: address || 'Localizacao atual',
      coordinates: { latitude, longitude },
    };
  } catch {
    return {
      id: 'origin-current',
      kind: 'custom',
      label: 'A minha localizacao',
      address: 'Localizacao atual',
      coordinates: { latitude, longitude },
    };
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentPlace, setCurrentPlace] = useState<SavedPlace>(defaultOrigin);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setCurrentPlace(defaultOrigin);
        return;
      }

      setPermissionDenied(false);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const place = await resolvePlaceFromCoords(position.coords.latitude, position.coords.longitude);
      setCurrentPlace(place);
    } catch {
      setCurrentPlace(defaultOrigin);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({ currentPlace, isLoading, permissionDenied, refresh }),
    [currentPlace, isLoading, permissionDenied]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation deve ser usado dentro de um <LocationProvider>');
  return ctx;
}
