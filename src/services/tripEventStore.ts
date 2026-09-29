import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripEventsRemote } from './extrasApi';
import { syncQuiet } from './remoteSync';

const STORAGE_KEY = '@angotour/trip_events';

export type TripEventType =
  | 'trip_created'
  | 'driver_assigned'
  | 'ride_started'
  | 'price_change_proposed'
  | 'price_change_accepted'
  | 'price_change_reported'
  | 'sos_triggered'
  | 'quick_message_sent'
  | 'cancelled'
  | 'completed';

export interface TripEvent {
  tripId: string;
  type: TripEventType;
  dateIso: string;
  meta?: Record<string, string | number>;
}

/**
 * Evidence Vault: fica no telemovel (rapido, offline) e e enviado ao servidor em segundo
 * plano, que guarda a hora oficial (createdAt) e a do telemovel (clientAt).
 */
export async function recordTripEvent(
  tripId: string,
  type: TripEventType,
  meta?: Record<string, string | number>
): Promise<void> {
  const event: TripEvent = { tripId, type, dateIso: new Date().toISOString(), meta };
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const all: TripEvent[] = raw ? JSON.parse(raw) : [];
    all.push(event);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // falha ao gravar nao deve bloquear o fluxo da viagem
  }
  syncQuiet(() => tripEventsRemote.create({ tripRef: tripId, type, meta, clientAt: event.dateIso }));
}

export async function getTripEvents(tripId: string): Promise<TripEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const all: TripEvent[] = raw ? JSON.parse(raw) : [];
    return all.filter((e) => e.tripId === tripId).sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  } catch {
    return [];
  }
}
