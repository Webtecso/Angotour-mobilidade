import { API_BASE_URL } from '../constants/env';
import { getToken } from './api';

async function call<T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: unknown): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : undefined;
  if (!response.ok) {
    const message = data?.message ?? `Erro ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return data as T;
}

// --- Favoritos: GET /favorites, PUT /favorites, DELETE /favorites/:placeKey ---
export interface RemoteFavoritePlace {
  placeKey: string;
  label: string;
  kind: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const favoritesRemote = {
  list: () => call<RemoteFavoritePlace[]>('/favorites'),
  upsert: (p: RemoteFavoritePlace) => call<unknown>('/favorites', 'PUT', p),
  remove: (placeKey: string) => call<unknown>(`/favorites/${encodeURIComponent(placeKey)}`, 'DELETE'),
};

// --- Evidence Vault: POST /trip-events ---
export const tripEventsRemote = {
  create: (body: { tripRef: string; type: string; meta?: Record<string, string | number>; clientAt?: string }) =>
    call<unknown>('/trip-events', 'POST', body),
};

// --- Cancelamentos: POST /cancellations ---
export const cancellationsRemote = {
  record: (reason: string, tripRef?: string) => call<unknown>('/cancellations', 'POST', { reason, tripRef }),
};

// --- Motorista favorito: GET/PUT/DELETE /favorite-driver ---
export interface RemoteFavoriteDriver {
  driverId: string | null;
  driverName: string | null;
}

export const favoriteDriverRemote = {
  get: () => call<RemoteFavoriteDriver>('/favorite-driver'),
  set: (driverId: string, driverName: string) => call<unknown>('/favorite-driver', 'PUT', { driverId, driverName }),
  clear: () => call<unknown>('/favorite-driver', 'DELETE'),
};

// --- Familia: GET/POST/DELETE /family ---
export interface RemoteFamilyMember {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export const familyRemote = {
  list: () => call<RemoteFamilyMember[]>('/family'),
  add: (name: string, phone: string, relationship: string) =>
    call<RemoteFamilyMember[]>('/family', 'POST', { name, phone, relationship }),
  remove: (id: string) => call<RemoteFamilyMember[]>(`/family/${id}`, 'DELETE'),
};

// --- Recompensas: GET /rewards, POST /rewards/:id/redeem ---
export interface RemoteRewardCatalogItem {
  id: string;
  title: string;
  costPoints: number;
}

export interface RemoteRewardRedemption {
  id: string;
  rewardId: string;
  title: string;
  costPoints: number;
  code: string;
  createdAt: string;
}

export const rewardsRemote = {
  list: () => call<{ catalog: RemoteRewardCatalogItem[]; redeemed: RemoteRewardRedemption[] }>('/rewards'),
  redeem: (rewardId: string) =>
    call<{ redemption: RemoteRewardRedemption; angoPoints: number }>(`/rewards/${rewardId}/redeem`, 'POST'),
};



// --- Avaliacoes: POST /ratings ---
export const ratingsRemote = {
  rate: (body: { tripRef: string; driverId?: string; stars: number; comment?: string }) =>
    call<unknown>('/ratings', 'POST', body),
};
