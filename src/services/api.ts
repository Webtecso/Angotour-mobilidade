import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/env';

const TOKEN_KEY = '@angotour/access_token';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(
      'Nao foi possivel ligar ao servidor. Confirma que o backend esta a correr e que o IP em src/constants/env.ts esta correto.',
      0,
    );
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = data?.message ?? `Erro ${response.status}`;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, response.status);
  }

  return data as T;
}

// --- Auth ---
export interface AuthResponse {
  accessToken: string;
  isNewUser: boolean;
  userId?: string;
}

export const authApi = {
  requestOtp: (phone: string) => request<{ message: string }>('/auth/otp/request', { method: 'POST', body: { phone } }),
  verifyOtp: (phone: string, code: string) => request<AuthResponse>('/auth/otp/verify', { method: 'POST', body: { phone, code } }),
  register: (data: { phone: string; fullName: string; birthDate?: string; preferredLanguage: 'pt' | 'en' }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data }),
};

// --- Trips ---
export interface CategoryEstimateResponse {
  categoryId: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  priceKz: number;
}

export interface RemoteDriver {
  id: string;
  fullName: string;
  phone: string;
  rating: number;
}

export interface RemoteTrip {
  id: string;
  priceKz: number;
  status: string;
  boardingCode?: string;
  driver?: RemoteDriver;
  driverLocation?: { latitude: number; longitude: number } | null;
}

interface TripPointBody {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const tripsApi = {
  estimate: (origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) =>
    request<CategoryEstimateResponse[]>('/trips/estimate', { method: 'POST', body: { origin, destination }, auth: true }),
  create: (body: {
    origin: TripPointBody;
    destination: TripPointBody;
    categoryId: string;
    scheduledFor?: string;
    paymentMethodType?: string;
    cashNoteKz?: number;
  }) => request<RemoteTrip>('/trips', { method: 'POST', body, auth: true }),
  assignDriver: (id: string, opts: { preferDriverId?: string; preferPhones?: string[] } = {}) =>
    request<RemoteTrip>(`/trips/${id}/assign-driver`, { method: 'PATCH', body: opts, auth: true }),
  start: (id: string) => request<RemoteTrip>(`/trips/${id}/start`, { method: 'PATCH', auth: true }),
  complete: (id: string, actualDistanceKm?: number) =>
    request<RemoteTrip>(`/trips/${id}/complete`, { method: 'PATCH', body: { actualDistanceKm }, auth: true }),
  cancel: (id: string, reason?: string) =>
    request<RemoteTrip>(`/trips/${id}/cancel`, { method: 'PATCH', body: { reason }, auth: true }),
  mine: () => request<RemoteTrip[]>('/trips/me', { auth: true }),
};

// --- Users ---
export const usersApi = {
  getMe: () => request('/users/me', { auth: true }),
};

// --- Suporte (Incident Center / Objetos perdidos) ---
export interface RemoteIncident {
  caseNumber: string;
  kind: string;
  category: string;
  description: string;
  tripRef?: string;
  status: string;
  createdAt: string;
}

export const supportApi = {
  createIncident: (body: { kind: 'incident' | 'lost_item'; category: string; description?: string; tripRef?: string }) =>
    request<RemoteIncident>('/support/incidents', { method: 'POST', body, auth: true }),
  mine: () => request<RemoteIncident[]>('/support/incidents/me', { auth: true }),
};


// --- Incidentes no backend (numero de caso oficial) ---
export interface IncidentApiRecord {
  caseNumber: string;
  kind: string;
  category: string;
  description: string;
  tripRef?: string;
  status: string;
  createdAt: string;
}

export const incidentsApi = {
  create: (body: { kind: 'incident' | 'lost_item'; category: string; description?: string; tripRef?: string }) =>
    request<IncidentApiRecord>('/support/incidents', { method: 'POST', body, auth: true }),
  mine: () => request<IncidentApiRecord[]>('/support/incidents/me', { auth: true }),
};
