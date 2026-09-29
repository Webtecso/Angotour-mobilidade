import { API_BASE_URL } from '../constants/env';
import { getToken } from './api';
import { Coordinates, VehicleCategoryId } from '../types';
import { TripHistoryEntry } from './mockData';

async function call<T>(path: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown): Promise<T> {
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

// --- Utilizador / perfil ---
export interface RemoteProfile {
  isVerified: boolean;
  angoPoints: number;
}

export const usersRemote = {
  me: () => call<any>('/users/me'),
};

export const profileRemote = {
  me: () => call<RemoteProfile>('/profile/me'),
  verifyIdentity: () => call<RemoteProfile>('/profile/verify-identity', 'POST'),
};

// --- Carteira ---
export interface RemoteTopUp {
  id: string;
  amountKz: number;
  reference: string;
  status: 'processing' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface RemoteWallet {
  balanceKz: number;
  topups: RemoteTopUp[];
}

export const walletRemote = {
  summary: () => call<RemoteWallet>('/wallet'),
  startTopUp: (amountKz: number) => call<RemoteTopUp>('/wallet/topups', 'POST', { amountKz }),
  // So funciona em desenvolvimento (simula o Multicaixa). Em producao a confirmacao vem por webhook.
  devConfirmTopUp: (id: string) => call<RemoteTopUp>(`/wallet/topups/${id}/confirm`, 'POST'),
};

// --- Historico de viagens ---
interface RemoteTripRow {
  id: string;
  createdAt: string;
  origin?: { label?: string; address?: string };
  destination?: { label?: string; address?: string };
  distanceKm: number;
  priceKz: number;
  categoryId: string;
  status: string;
  driver?: { fullName?: string };
}

export async function fetchTripHistory(): Promise<TripHistoryEntry[]> {
  const rows = await call<RemoteTripRow[]>('/trips/me');
  return rows
    .filter((r) => r.status === 'completed' || r.status === 'cancelled')
    .map((r) => ({
      id: r.id,
      dateIso: r.createdAt,
      originLabel: r.origin?.label || r.origin?.address || '-',
      destinationLabel: r.destination?.label || r.destination?.address || '-',
      distanceKm: r.distanceKm,
      priceKz: r.priceKz,
      categoryId: r.categoryId as VehicleCategoryId,
      driverName: r.driver?.fullName ?? '-',
      status: r.status as 'completed' | 'cancelled',
    }));
}

// --- Motoristas por perto (carros reais no mapa) ---
function parseLocation(loc: unknown): Coordinates | null {
  if (!loc) return null;
  let geo: any = loc;
  if (typeof loc === 'string') {
    try { geo = JSON.parse(loc); } catch { return null; }
  }
  const c = geo?.coordinates;
  if (Array.isArray(c) && c.length >= 2) return { latitude: Number(c[1]), longitude: Number(c[0]) };
  return null;
}

export async function fetchNearbyDrivers(center: Coordinates, radiusKm = 5): Promise<Coordinates[]> {
  const rows = await call<any[]>(`/drivers/nearby?lat=${center.latitude}&lng=${center.longitude}&radiusKm=${radiusKm}`);
  return rows.map((r) => parseLocation(r.currentLocation)).filter((x): x is Coordinates => !!x);
}
