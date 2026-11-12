import AsyncStorage from '@react-native-async-storage/async-storage';
import { rewardsRemote, RemoteRewardCatalogItem } from './extrasApi';
import { withTimeout } from './remoteSync';

const STORAGE_KEY = '@angotour/redeemed_rewards';
const CATALOG_KEY = '@angotour/rewards_catalog';

export interface RedeemedReward {
  id: string;
  rewardId: string;
  title: string;
  costPoints: number;
  code: string;
  dateIso: string;
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
 * Catalogo real do servidor (o servidor e a fonte da verdade do custo em
 * pontos). Sem rede, cai para a ultima copia guardada localmente.
 */
export async function getRewardsCatalog(): Promise<RemoteRewardCatalogItem[]> {
  try {
    const remote = await withTimeout(rewardsRemote.list());
    await AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(remote.catalog));
    return remote.catalog;
  } catch {
    try {
      const raw = await AsyncStorage.getItem(CATALOG_KEY);
      return raw ? (JSON.parse(raw) as RemoteRewardCatalogItem[]) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Resgata no servidor, que confirma e desconta os pontos. Sem confirmacao do
 * servidor nao ha voucher: a funcao falha com o motivo, em vez de inventar um codigo.
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    throw new Error(msg === 'timeout' ? 'Sem ligacao ao servidor. Tenta outra vez.' : msg || 'Nao foi possivel resgatar.');
  }
}
