import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancellationsRemote } from './extrasApi';
import { syncQuiet } from './remoteSync';

const STORAGE_KEY = '@angotour/cancellations';
const WINDOW_DAYS = 30;

export type CancellationRisk = 'legitimo' | 'monitorizar' | 'suspeito';

export interface CancellationRecord {
  reason: string;
  dateIso: string;
}

async function readAll(): Promise<CancellationRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CancellationRecord[]) : [];
  } catch {
    return [];
  }
}

function withinWindow(record: CancellationRecord): boolean {
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return new Date(record.dateIso).getTime() >= cutoff;
}

export function classifyCancellationRisk(recentCount: number): CancellationRisk {
  if (recentCount <= 1) return 'legitimo';
  if (recentCount <= 3) return 'monitorizar';
  return 'suspeito';
}

/**
 * Regista um cancelamento e devolve a classificacao de risco resultante,
 * com base no numero de cancelamentos nos ultimos 30 dias (secao 15 do
 * documento de pesquisa: legitimo / a monitorizar / padrao suspeito).
 * Persistido em AsyncStorage para sobreviver a reaberturas da app.
 */
export async function recordCancellation(reason: string): Promise<CancellationRisk> {
  const all = await readAll();
  const next = [...all, { reason, dateIso: new Date().toISOString() }];
  syncQuiet(() => cancellationsRemote.record(reason));
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // falha ao gravar nao deve bloquear o cancelamento da viagem
  }
  const recentCount = next.filter(withinWindow).length;
  return classifyCancellationRisk(recentCount);
}


