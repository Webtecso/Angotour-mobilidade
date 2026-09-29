import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, PlaceKind, SavedPlace } from '../types';
import { favoritesRemote, RemoteFavoritePlace } from './extrasApi';
import { syncQuiet, withTimeout } from './remoteSync';

const STORAGE_KEY = '@angotour/favorite_places';

async function read(): Promise<SavedPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function write(places: SavedPlace[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  } catch {
    // falha ao gravar nao deve bloquear o fluxo
  }
}

function toRemote(p: SavedPlace): RemoteFavoritePlace {
  return {
    placeKey: p.id.slice(0, 60),
    label: p.label.slice(0, 80),
    kind: p.kind,
    address: p.address.slice(0, 200),
    latitude: p.coordinates.latitude,
    longitude: p.coordinates.longitude,
  };
}

function toSaved(r: RemoteFavoritePlace): SavedPlace {
  return {
    id: r.placeKey,
    kind: r.kind as PlaceKind,
    label: r.label,
    address: r.address,
    coordinates: { latitude: r.latitude, longitude: r.longitude },
  };
}

/** Lista local; com rede, junta com o servidor (o servidor manda, o que so existe aqui sobe). */
export async function getFavoritePlaces(): Promise<SavedPlace[]> {
  const local = await read();
  try {
    const remote = await withTimeout(favoritesRemote.list());
    const remoteKeys = new Set(remote.map((r) => r.placeKey));
    const onlyLocal = local.filter((p) => !remoteKeys.has(p.id.slice(0, 60)));
    for (const p of onlyLocal) {
      syncQuiet(() => favoritesRemote.upsert(toRemote(p)));
    }
    const merged = [...remote.map(toSaved), ...onlyLocal];
    await write(merged);
    return merged;
  } catch {
    return local;
  }
}

/** Guarda (ou substitui) um local favorito. "Casa" e "Trabalho" ocupam um unico lugar cada. */
export async function saveFavoritePlace(
  id: string,
  label: string,
  kind: PlaceKind,
  address: string,
  coordinates: Coordinates
): Promise<SavedPlace[]> {
  const all = await read();
  const place: SavedPlace = { id, kind, label, address, coordinates };
  const next: SavedPlace[] = [...all.filter((p) => p.id !== id), place];
  await write(next);
  syncQuiet(() => favoritesRemote.upsert(toRemote(place)));
  return next;
}

export async function removeFavoritePlace(id: string): Promise<SavedPlace[]> {
  const next = (await read()).filter((p) => p.id !== id);
  await write(next);
  syncQuiet(() => favoritesRemote.remove(id.slice(0, 60)));
  return next;
}

/** Alterna um local como favorito (estrela na pesquisa de destino). Devolve a lista atualizada. */
export async function toggleFavoritePlace(place: SavedPlace): Promise<SavedPlace[]> {
  const all = await read();
  const exists = all.some((p) => p.id === place.id);
  if (exists) {
    const next = all.filter((p) => p.id !== place.id);
    await write(next);
    syncQuiet(() => favoritesRemote.remove(place.id.slice(0, 60)));
    return next;
  }
  const added: SavedPlace = { ...place, kind: place.kind === 'recent' ? 'favorite' : place.kind };
  const next = [...all, added];
  await write(next);
  syncQuiet(() => favoritesRemote.upsert(toRemote(added)));
  return next;
}
