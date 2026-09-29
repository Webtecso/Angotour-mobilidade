import AsyncStorage from '@react-native-async-storage/async-storage';
import { incidentsApi } from './api';

const STORAGE_KEY = '@angotour/incidents';

export interface IncidentRecord {
  caseNumber: string;
  category: string;
  description: string;
  tripId?: string;
  photoUri?: string;
  dateIso: string;
  status: 'recebido';
  synced?: boolean;
}

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `AT-${year}-${digits}`;
}

async function saveLocal(record: IncidentRecord): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const all: IncidentRecord[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...all]));
  } catch {
    // falha ao gravar nao deve bloquear a criacao do caso
  }
}

/**
 * Regista um incidente ou objeto perdido. Envia para o backend (numero de caso
 * oficial); se estiver offline, cria um caso local marcado como nao sincronizado.
 * A foto (photoUri) fica so no registo local: o backend ainda nao recebe ficheiros.
 */
export async function recordIncident(
  category: string,
  description: string,
  tripId?: string,
  photoUri?: string
): Promise<IncidentRecord> {
  const kind = category.startsWith('Objeto perdido') ? 'lost_item' : 'incident';

  try {
    const remote = await incidentsApi.create({ kind, category, description, tripRef: tripId });
    const record: IncidentRecord = {
      caseNumber: remote.caseNumber,
      category,
      description,
      tripId,
      photoUri,
      dateIso: remote.createdAt,
      status: 'recebido',
      synced: true,
    };
    await saveLocal(record);
    return record;
  } catch {
    const record: IncidentRecord = {
      caseNumber: generateCaseNumber(),
      category,
      description,
      tripId,
      photoUri,
      dateIso: new Date().toISOString(),
      status: 'recebido',
      synced: false,
    };
    await saveLocal(record);
    return record;
  }
}
