import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@angotour/wallet_topups';

export const INITIAL_BALANCE_KZ = 12500;

export interface WalletTopUp {
  id: string;
  dateIso: string;
  amountKz: number;
  reference: string;
  status: 'processing' | 'confirmed' | 'failed';
}

function generateReference(): string {
  return Math.floor(900000000 + Math.random() * 99999999).toString();
}

async function readTopUps(): Promise<WalletTopUp[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeTopUps(topUps: WalletTopUp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(topUps));
  } catch {
    // falha ao gravar nao deve bloquear o fluxo
  }
}

export async function getTopUps(): Promise<WalletTopUp[]> {
  const all = await readTopUps();
  return all.sort((a, b) => b.dateIso.localeCompare(a.dateIso));
}

/**
 * Carregar Carteira (seccao 14 do documento): gera uma referencia simulada
 * de Multicaixa Express. O estado comeca "processing" e e confirmado pouco
 * depois - nunca assumimos confirmacao instantanea (seccao 29).
 */
export async function startTopUp(amountKz: number): Promise<WalletTopUp> {
  const topUp: WalletTopUp = {
    id: `topup-${Date.now()}`,
    dateIso: new Date().toISOString(),
    amountKz,
    reference: generateReference(),
    status: 'processing',
  };
  const all = await readTopUps();
  await writeTopUps([topUp, ...all]);
  return topUp;
}

export async function confirmTopUp(id: string): Promise<void> {
  const all = await readTopUps();
  const updated = all.map((t) => (t.id === id ? { ...t, status: 'confirmed' as const } : t));
  await writeTopUps(updated);
}

export async function getConfirmedBalanceAdjustment(): Promise<number> {
  const all = await readTopUps();
  return all.filter((t) => t.status === 'confirmed').reduce((sum, t) => sum + t.amountKz, 0);
}
