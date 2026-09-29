import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoriteDriverRemote } from './extrasApi';
import { syncQuiet, withTimeout } from './remoteSync';

const STORAGE_KEY = '@angotour/favorite_driver';

export interface FavoriteDriver {
  driverId: string;
  driverName: string;
}

async function readLocal(): Promise<FavoriteDriver | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Motorista preferido: o matching tenta atribui-lo primeiro. Com rede, o
 * servidor e a fonte da verdade; sem rede, usa o que esta no telemovel.
 */
export async function getFavoriteDriver(): Promise<FavoriteDriver | null> {
  const local = await readLocal();
  try {
    const remote = await withTimeout(favoriteDriverRemote.get());
    if (remote.driverId && remote.driverName) {
      const value: FavoriteDriver = { driverId: remote.driverId, driverName: remote.driverName };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return value;
    }
    if (local) syncQuiet(() => favoriteDriverRemote.set(local.driverId, local.driverName));
    return local;
  } catch {
    return local;
  }
}

export async function setFavoriteDriver(driverId: string, driverName: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ driverId, driverName }));
  } catch {
    // falha ao gravar nao deve bloquear o fluxo
  }
  syncQuiet(() => favoriteDriverRemote.set(driverId, driverName));
}

export async function clearFavoriteDriver(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
  syncQuiet(() => favoriteDriverRemote.clear());
}
