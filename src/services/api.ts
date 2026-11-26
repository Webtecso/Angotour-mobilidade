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
  gender?: string;
  id: string;
  fullName: string;
  phone: string;
  rating: number;
}

export interface RemoteVehicle {
  model: string;
  plate: string;
  color: string;
  categoryId: string;
}

export interface RemoteTrip {
  id: string;
  priceKz: number;
  status: string;
  boardingCode?: string;
  driver?: RemoteDriver;
  driverLocation?: { latitude: number; longitude: number } | null;
  vehicle?: RemoteVehicle | null;
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
    stops?: TripPointBody[];
  }) => request<RemoteTrip>('/trips', { method: 'POST', body, auth: true }),
  assignDriver: (id: string, opts: { preferDriverId?: string; preferPhones?: string[] } = {}) =>
    request<RemoteTrip>(`/trips/${id}/assign-driver`, { method: 'PATCH', body: opts, auth: true }),
  start: (id: string) => request<RemoteTrip>(`/trips/${id}/start`, { method: 'PATCH', auth: true }),
  complete: (id: string, actualDistanceKm?: number) =>
    request<RemoteTrip>(`/trips/${id}/complete`, { method: 'PATCH', body: { actualDistanceKm }, auth: true }),
  cancel: (id: string, reason?: string) =>
    request<RemoteTrip>(`/trips/${id}/cancel`, { method: 'PATCH', body: { reason }, auth: true }),
  mine: () => request<RemoteTrip[]>('/trips/me', { auth: true }),
  get: (id: string) => request<RemoteTrip>(`/trips/${id}`, { auth: true }),
};

// --- Users ---
export const usersApi = {
  getMe: () => request('/users/me', { auth: true }),
  update: (dto: { fullName?: string; email?: string; birthDate?: string; preferredLanguage?: 'pt' | 'en' }) =>
    request<any>('/users/me', { method: 'PATCH', body: dto, auth: true }),
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
  create: (body: { kind: 'incident' | 'lost_item' | 'sos'; category: string; description?: string; tripRef?: string }) =>
    request<IncidentApiRecord>('/support/incidents', { method: 'POST', body, auth: true }),
  mine: () => request<IncidentApiRecord[]>('/support/incidents/me', { auth: true }),
  updateLocation: (caseNumber: string, latitude: number, longitude: number) =>
    request<IncidentApiRecord>('/support/incidents/' + caseNumber + '/location', { method: 'POST', body: { latitude, longitude }, auth: true }),
  resolve: (caseNumber: string) =>
    request<IncidentApiRecord>('/support/incidents/' + caseNumber + '/resolve', { method: 'POST', auth: true }),
};


// --- AngoTour Mensal: pedido, proposta, aceitacao e pagamento ---
export interface MonthlyPlanView { id: string; name: string; modality: 'shared' | 'individual'; priceKz: number; weeklyFrequency: number; tripsPerDay: number; conditions?: string }
export interface MonthlyRequestView { id: string; modality: string; originLabel: string; destinationLabel: string; status: string; startDate: string; createdAt: string }
export interface MonthlyContractView {
  id: string; modality: string; priceKz: number; startDate: string; endDate?: string | null; status: string;
  paymentReference?: string | null; proposalExpiresAt?: string | null; driverId?: string | null; vehicleId?: string | null;
}

export const monthlyApi = {
  plans: () => request<MonthlyPlanView[]>('/monthly/plans', { auth: true }),
  createRequest: (body: {
    modality: 'shared' | 'individual'; originLabel: string; originLatitude: number; originLongitude: number;
    destinationLabel: string; destinationLatitude: number; destinationLongitude: number;
    preferredDays: string[]; departureTime: string; returnTime?: string; startDate: string; passengerCount?: number; specialNeeds?: string;
  }) => request<MonthlyRequestView>('/monthly/requests', { method: 'POST', body, auth: true }),
  myRequests: () => request<MonthlyRequestView[]>('/monthly/requests/me', { auth: true }),
  myContracts: () => request<MonthlyContractView[]>('/monthly/contracts/me', { auth: true }),
  accept: (id: string) => request<MonthlyContractView>(`/monthly/contracts/${id}/accept`, { method: 'POST', body: { conditionsAccepted: true }, auth: true }),
  reject: (id: string) => request<MonthlyContractView>(`/monthly/contracts/${id}/reject`, { method: 'POST', auth: true }),
  cancelPreview: (id: string) => request<{ refundKz: number; remaining: number; total: number }>(`/monthly/contracts/${id}/cancel-preview`, { auth: true }),
  cancel: (id: string) => request<MonthlyContractView>(`/monthly/contracts/${id}/cancel`, { method: 'POST', auth: true }),
  renew: (id: string) => request<MonthlyContractView>(`/monthly/contracts/${id}/renew`, { method: 'POST', auth: true }),
  confirmPayment: (id: string) => request<MonthlyContractView>(`/monthly/contracts/${id}/payment/confirm`, { method: 'POST', auth: true }),
};

// --- Chat passageiro-motorista (so participantes da viagem) ---
export interface ChatMessageView { id: string; senderRole: 'passenger' | 'driver'; body: string; createdAt: string; fromMe: boolean }
export interface ChatThreadView { messages: ChatMessageView[]; canSend: boolean }
export const chatApi = {
  list: (tripId: string) => request<ChatThreadView>(`/chat/trips/${tripId}/messages`, { auth: true }),
  send: (tripId: string, body: string) =>
    request<ChatMessageView>(`/chat/trips/${tripId}/messages`, { method: 'POST', body: { body }, auth: true }),
};

// --- Verificacao de identidade do passageiro: BI (frente/verso) e selfie ---
export type IdentityDocumentServerType = 'bi_front' | 'bi_back' | 'selfie';
export interface IdentityDocumentView {
  type: IdentityDocumentServerType;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  updatedAt: string | null;
}
export const identityDocumentsApi = {
  list: () => request<IdentityDocumentView[]>('/identity-documents', { auth: true }),
  submit: (type: IdentityDocumentServerType, imageBase64: string) =>
    request<{ type: string; status: string }>('/identity-documents/' + type, { method: 'POST', body: { imageBase64 }, auth: true }),
};

// Sessao recusada pelo servidor (token invalido ou utilizador inexistente): quem estiver a ouvir termina a sessao.
let unauthorizedHandler: (() => void) | null = null;
let unauthorizedFired = false;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
  unauthorizedFired = false;
}
export function notifyUnauthorized(): void {
  if (unauthorizedFired || !unauthorizedHandler) return;
  unauthorizedFired = true;
  unauthorizedHandler();
}
