import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@angotour/settings';

export interface EmergencyContact {
  name: string;
  phone: string;
}

interface SettingsState {
  womenModeEnabled: boolean;
  autoShareTripEnabled: boolean;
  emergencyContact: EmergencyContact | null;
}

interface SettingsContextValue extends SettingsState {
  isLoading: boolean;
  setWomenModeEnabled: (value: boolean) => void;
  setAutoShareTripEnabled: (value: boolean) => void;
  setEmergencyContact: (contact: EmergencyContact | null) => void;
}

const DEFAULT_STATE: SettingsState = {
  womenModeEnabled: false,
  autoShareTripEnabled: false,
  emergencyContact: null,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (next: SettingsState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setWomenModeEnabled = (value: boolean) => {
    // Ativar o Modo Mulher liga automaticamente a partilha de viagem,
    // por seguranca - o utilizador pode desligar a partilha manualmente depois.
    persist({ ...state, womenModeEnabled: value, autoShareTripEnabled: value ? true : state.autoShareTripEnabled });
  };

  const setAutoShareTripEnabled = (value: boolean) => {
    persist({ ...state, autoShareTripEnabled: value });
  };

  const setEmergencyContact = (contact: EmergencyContact | null) => {
    persist({ ...state, emergencyContact: contact });
  };

  const value = useMemo(
    () => ({ ...state, isLoading, setWomenModeEnabled, setAutoShareTripEnabled, setEmergencyContact }),
    [state, isLoading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de um <SettingsProvider>');
  return ctx;
}
