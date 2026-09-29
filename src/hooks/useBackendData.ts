import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Coordinates } from '../types';
import { TripHistoryEntry } from '../services/mockData';
import { RemoteWallet, fetchNearbyDrivers, fetchTripHistory, walletRemote } from '../services/backendApi';

/** Historico vindo do backend; enquanto nao chega (ou se falhar) usa o fallback local. */
export function useTripHistory(fallback: TripHistoryEntry[]) {
  const [data, setData] = useState<TripHistoryEntry[]>(fallback);
  const [isRemote, setIsRemote] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchTripHistory());
      setIsRemote(true);
    } catch {
      setIsRemote(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  return { data, isRemote, loading, refresh };
}

/** Saldo e carregamentos da carteira no servidor (null enquanto nao ha resposta). */
export function useWallet() {
  const [wallet, setWallet] = useState<RemoteWallet | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setWallet(await walletRemote.summary());
    } catch {
      // mantem o ultimo valor conhecido
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  return { wallet, loading, refresh };
}

/** Posicoes de motoristas online por perto; vazio se nao houver ou se falhar. */
export function useNearbyDrivers(center: Coordinates, radiusKm = 5) {
  const [cars, setCars] = useState<Coordinates[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchNearbyDrivers(center, radiusKm)
        .then((list) => { if (!cancelled) setCars(list); })
        .catch(() => {});
      return () => { cancelled = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center.latitude, center.longitude, radiusKm])
  );

  return cars;
}
