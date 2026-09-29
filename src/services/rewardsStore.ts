import AsyncStorage from '@react-native-async-storage/async-storage';
import { rewardsRemote } from './extrasApi';
import { withTimeout } from './remoteSync';

const STORAGE_KEY = '@angotour/redeemed_rewards';

export interface RedeemedReward {
  id: string;
  rewardId: string;
  title: string;
  costPoints: number;
  code: string;
  dateIso: string;
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'AT-' + suffix;
}

export async function getRedeemedRewards(): Promise<RedeemedReward[]> {
  try {
    const remote = await withTimeout(rewardsRemote.list());
    const mapped: RedeemedReward[] = remote.redeemed.map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      title: r.title,
      costPoints: r.costPoints,
      code: r.code,
      dateIso: r.createdAt,
    }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    return mapped;
  } catch {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RedeemedReward[]) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Resgata no servidor (que confirma e desconta os pontos com seguranca). Se
 * falhar (sem rede, sem sessao), resgata so localmente com um codigo gerado
 * aqui - nunca bloqueia o utilizador, mas nesse caso os pontos nao descontam
 * no servidor ate haver rede outra vez.
 */
export async function saveRedeemedReward(reward: { id: string; title: string; costPoints: number }): Promise<RedeemedReward> {
  try {
    const result = await withTimeout(rewardsRemote.redeem(reward.id));
    const record: RedeemedReward = {
      id: result.redemption.id,
      rewardId: result.redemption.rewardId,
      title: result.redemption.title,
      costPoints: result.redemption.costPoints,
      code: result.redemption.code,
      dateIso: result.redemption.createdAt,
    };
    try {
      const all = await getRedeemedRewards();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...all.filter((r) => r.id !== record.id)]));
    } catch {
      // falha ao gravar localmente nao invalida o resgate ja confirmado no servidor
    }
    return record;
  } catch {
    const record: RedeemedReward = {
      id: 'rd-' + Date.now(),
      rewardId: reward.id,
      title: reward.title,
      costPoints: reward.costPoints,
      code: generateVoucherCode(),
      dateIso: new Date().toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const all: RedeemedReward[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...all]));
    } catch {
      // falha ao gravar nao bloqueia o resgate
    }
    return record;
  }
}



