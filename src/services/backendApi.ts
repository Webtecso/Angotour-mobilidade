import { API_BASE_URL } from '../constants/env';
import { getToken } from './api';
import { Coordinates, SavedPlace, VehicleCategoryId } from '../types';
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
  verificationStatus?: string;
}

export const usersRemote = {
  me: () => call<any>('/users/me'),
};

export const profileRemote = {
  me: () => call<RemoteProfile>('/profile/me'),
  verifyIdentity: () => call<RemoteProfile>('/profile/verify-identity', 'POST'),
};

export const pushRemote = {
  registerToken: (pushToken: string) => call<void>('/profile/push-token', 'PATCH', { pushToken }),
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

/** Destinos das viagens concluidas do utilizador (sem repetidos, mais recentes primeiro). */
export async function fetchRecentPlaces(): Promise<SavedPlace[]> {
  const rows = await call<any[]>('/trips/me');
  const seen = new Set<string>();
  const out: SavedPlace[] = [];
  const sorted = [...rows]
    .filter((r) => r.status === 'completed' && r.destination?.latitude != null && r.destination?.longitude != null)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  for (const r of sorted) {
    const d = r.destination;
    const label = String(d.label || d.address || '').trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push({
      id: 'recent-' + Number(d.latitude).toFixed(5) + '_' + Number(d.longitude).toFixed(5),
      kind: 'custom',
      label,
      address: String(d.address || label),
      coordinates: { latitude: Number(d.latitude), longitude: Number(d.longitude) },
    });
    if (out.length >= 8) break;
  }
  return out;
}

/** Pontos AngoPoints do utilizador, lidos do servidor (fonte unica). */
export async function fetchMyPoints(): Promise<number> {
  const p = await call<RemoteProfile>('/profile/me');
  return Number(p.angoPoints ?? 0);
}

/** Destinos populares editaveis no painel (tabela popular_destinations). */
export interface PopularDestination {
  id: string;
  title: string;
  address: string;
  kind: string;
  coordinates: Coordinates;
}

export async function fetchPopularDestinations(): Promise<PopularDestination[]> {
  return call<PopularDestination[]>('/destinations');
}

/** Pesquisa de locais em Angola (destinos do painel + OpenStreetMap), via backend. */
export async function searchPlaces(q: string): Promise<SavedPlace[]> {
  const rows = await call<any[]>('/destinations/search?q=' + encodeURIComponent(q));
  return rows.map((r) => ({
    id: String(r.id),
    kind: 'custom' as const,
    label: String(r.title),
    address: String(r.address),
    coordinates: { latitude: Number(r.coordinates.latitude), longitude: Number(r.coordinates.longitude) },
  }));
}

/** Nome do local (rua, bairro) a partir de coordenadas, via backend (OpenStreetMap). null se nao houver nome util. */
export async function reverseLabel(c: Coordinates): Promise<string | null> {
  const r = await call<{ label: string | null }>('/destinations/reverse?lat=' + c.latitude + '&lng=' + c.longitude);
  return r?.label ?? null;
}
