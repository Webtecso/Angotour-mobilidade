import { API_BASE_URL } from '../constants/env';
import { vehicleCategories } from './mockData';

const FIELDS = ['tarifaBaseKz', 'precoPorKmKz', 'precoPorMinKz', 'tarifaMinimaKz', 'velocidadeMediaKmh'] as const;

/**
 * Atualiza as tarifas locais com as do servidor (editaveis no painel Admin).
 * O servidor calcula sempre o preco final na criacao da viagem; isto so mantem
 * a estimativa mostrada ao passageiro alinhada. Sem rede, ficam as tarifas locais.
 */
export async function syncPricing(): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${API_BASE_URL}/pricing`, { signal: controller.signal });
    if (!res.ok) return;
    const list = await res.json();
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const target = vehicleCategories.find((c) => c.id === item.id);
      if (!target) continue;
      for (const f of FIELDS) {
        const v = item[f];
        const valid = typeof v === 'number' && Number.isFinite(v) && (f === 'velocidadeMediaKmh' ? v > 0 : v >= 0);
        if (valid) (target as any)[f] = v;
      }
    }
  } catch {
    // sem rede ou servidor em baixo: mantem as tarifas locais
  } finally {
    clearTimeout(timer);
  }
}
