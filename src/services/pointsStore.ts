import AsyncStorage from '@react-native-async-storage/async-storage';

const BALANCE_KEY = '@angotour/ango_points_balance';
const AWARDED_KEY = '@angotour/ango_points_awarded_trips';
const REDEMPTIONS_KEY = '@angotour/ango_points_redemptions';

const STARTING_BALANCE = 320;

export interface PointsRedemption {
  rewardId: string;
  rewardTitle: string;
  costPoints: number;
  dateIso: string;
}

export async function getPointsBalance(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BALANCE_KEY);
    return raw !== null ? parseInt(raw, 10) : STARTING_BALANCE;
  } catch {
    return STARTING_BALANCE;
  }
}

async function setPointsBalance(value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BALANCE_KEY, String(value));
  } catch {
    // falha ao gravar nao deve bloquear o fluxo
  }
}

/**
 * AngoPoints ganhos por viagem (seccao 19 do documento): 1 ponto por cada
 * 100 Kz gastos, minimo de 1. Idempotente por viagem - uma mesma viagem so
 * atribui pontos uma vez, mesmo que o ecra seja revisitado.
 */
export async function awardPointsForTrip(tripId: string, priceKz: number): Promise<number> {
  try {
    const rawAwarded = await AsyncStorage.getItem(AWARDED_KEY);
    const awarded: string[] = rawAwarded ? JSON.parse(rawAwarded) : [];
    if (awarded.includes(tripId)) return 0;

    const points = Math.max(1, Math.round(priceKz / 100));
    const current = await getPointsBalance();
    await setPointsBalance(current + points);
    await AsyncStorage.setItem(AWARDED_KEY, JSON.stringify([...awarded, tripId]));
    return points;
  } catch {
    return 0;
  }
}

/**
 * AngoPoints - resgate de recompensas (seccao 19, 64-65 do documento): liga
 * a fidelizacao do passageiro ao ecossistema de turismo AngoTour.
 */
export async function redeemReward(rewardId: string, rewardTitle: string, costPoints: number): Promise<boolean> {
  const current = await getPointsBalance();
  if (current < costPoints) return false;

  await setPointsBalance(current - costPoints);
  try {
    const raw = await AsyncStorage.getItem(REDEMPTIONS_KEY);
    const all: PointsRedemption[] = raw ? JSON.parse(raw) : [];
    all.unshift({ rewardId, rewardTitle, costPoints, dateIso: new Date().toISOString() });
    await AsyncStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(all));
  } catch {
    // historico de resgates e so informativo - falha aqui nao desfaz o resgate
  }
  return true;
}

export async function getRedemptions(): Promise<PointsRedemption[]> {
  try {
    const raw = await AsyncStorage.getItem(REDEMPTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
