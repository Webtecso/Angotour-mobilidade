import { Coordinates, Driver, PaymentMethod, PriceBreakdown, QuickShortcut, ReferenceCategory, SavedPlace, VehicleCategory, VehicleCategoryId } from '../types';

/**
 * Dados de demonstracao para desenvolvimento do frontend.
 * Quando o backend (NestJS) estiver disponivel, estas funcoes/constantes
 * serao substituidas por chamadas reais em src/services/api.ts.
 */

// Tarifas fixas e transparentes por categoria. Sem sobretaxas dinamicas por procura.
// O preco mostrado ao passageiro e sempre o preco final - nunca sobe por hora de ponta,
// chuva ou baixa oferta de motoristas. Isto e uma decisao de produto deliberada.
export const vehicleCategories: VehicleCategory[] = [
  { id: 'ango_taxi', name: 'AngoTaxi', description: 'Economico, para o dia a dia', icon: 'car-outline', tarifaBaseKz: 500, precoPorKmKz: 180, precoPorMinKz: 15, tarifaMinimaKz: 800, velocidadeMediaKmh: 22, etaMinutes: 3, capacity: 4 },
  { id: 'ango_conforto', name: 'Conforto', description: 'Mais conforto para voce', icon: 'car-side', tarifaBaseKz: 700, precoPorKmKz: 230, precoPorMinKz: 20, tarifaMinimaKz: 1100, velocidadeMediaKmh: 22, etaMinutes: 4, capacity: 4 },
  { id: 'ango_executivo', name: 'Executivo', description: 'Para ocasioes especiais', icon: 'car-sports', tarifaBaseKz: 1000, precoPorKmKz: 320, precoPorMinKz: 28, tarifaMinimaKz: 1600, velocidadeMediaKmh: 24, etaMinutes: 6, capacity: 4 },
  { id: 'ango_family', name: 'Familia', description: 'Mais espaco para voce', icon: 'car-estate', tarifaBaseKz: 800, precoPorKmKz: 260, precoPorMinKz: 22, tarifaMinimaKz: 1300, velocidadeMediaKmh: 20, etaMinutes: 5, capacity: 6 },
  { id: 'ango_moto', name: 'Moto', description: 'Rapido para curtas distancias', icon: 'motorbike', tarifaBaseKz: 250, precoPorKmKz: 100, precoPorMinKz: 8, tarifaMinimaKz: 400, velocidadeMediaKmh: 28, etaMinutes: 3, capacity: 1 },
  { id: 'ango_grupo', name: 'Grupo', description: 'Para grupos maiores', icon: 'account-group-outline', tarifaBaseKz: 1200, precoPorKmKz: 380, precoPorMinKz: 32, tarifaMinimaKz: 2000, velocidadeMediaKmh: 20, etaMinutes: 7, capacity: 8 },
  { id: 'ango_aeroporto', name: 'Aeroporto', description: 'Mais espaco para malas', icon: 'airplane', tarifaBaseKz: 900, precoPorKmKz: 240, precoPorMinKz: 20, tarifaMinimaKz: 1500, velocidadeMediaKmh: 26, etaMinutes: 4, capacity: 4 },
  { id: 'ango_tour', name: 'Turismo', description: 'Motoristas preparados para turismo', icon: 'compass-outline', tarifaBaseKz: 1000, precoPorKmKz: 300, precoPorMinKz: 25, tarifaMinimaKz: 1700, velocidadeMediaKmh: 20, etaMinutes: 8, capacity: 4 },
  { id: 'ango_acessivel', name: 'Acessivel', description: 'Preparado para mobilidade reduzida', icon: 'wheelchair-accessibility', tarifaBaseKz: 700, precoPorKmKz: 220, precoPorMinKz: 18, tarifaMinimaKz: 1100, velocidadeMediaKmh: 20, etaMinutes: 8, capacity: 4 },
  { id: 'ango_cavalo', name: 'Cavalo', description: 'Velocidade nobre, corrida agil', icon: 'horse', tarifaBaseKz: 500, precoPorKmKz: 180, precoPorMinKz: 15, tarifaMinimaKz: 800, velocidadeMediaKmh: 22, etaMinutes: 3, capacity: 4 },
  { id: 'ango_bruxa', name: 'Bruxa', description: 'Uma viagem com magia', icon: 'broom', tarifaBaseKz: 700, precoPorKmKz: 230, precoPorMinKz: 20, tarifaMinimaKz: 1100, velocidadeMediaKmh: 22, etaMinutes: 4, capacity: 4 },
  { id: 'ango_tapete', name: 'Tapete Magico', description: 'Luxo a voar sobre a cidade', icon: 'flare', tarifaBaseKz: 1000, precoPorKmKz: 320, precoPorMinKz: 28, tarifaMinimaKz: 1600, velocidadeMediaKmh: 24, etaMinutes: 6, capacity: 4 },
];

export const homeGridCategoryIds: VehicleCategory['id'][] = [
  'ango_taxi', 'ango_conforto', 'ango_executivo', 'ango_family',
  'ango_moto', 'ango_grupo', 'ango_aeroporto', 'ango_tour',
];

export const defaultOrigin: SavedPlace = {
  id: 'origin-current',
  kind: 'custom',
  label: 'A minha localizacao',
  address: 'Talatona, Luanda',
  coordinates: { latitude: -8.9219, longitude: 13.1889 },
};

export const recentPlaces: SavedPlace[] = [
  { id: 'p1', kind: 'recent', label: 'Belas Shopping', address: 'Estrada de Belas, Talatona, Luanda', coordinates: { latitude: -8.9219, longitude: 13.1889 } },
  { id: 'p2', kind: 'recent', label: 'Aeroporto Internacional 4 de Fevereiro', address: 'Luanda', coordinates: { latitude: -8.8584, longitude: 13.2312 } },
  { id: 'p3', kind: 'recent', label: 'Marginal de Luanda', address: 'Ingombota, Luanda', coordinates: { latitude: -8.8115, longitude: 13.2302 } },
];

// Base de Referencias Angolanas (seccao 20 do documento): categorias comuns
// sugeridas ao passageiro ao escrever a referencia do destino.
export const angolanReferenceCategories: ReferenceCategory[] = [
  { id: 'escola', label: 'Escola', icon: 'school-outline' },
  { id: 'igreja', label: 'Igreja', icon: 'business-outline' },
  { id: 'mercado', label: 'Mercado', icon: 'storefront-outline' },
  { id: 'bomba', label: 'Bomba de gasolina', icon: 'car-outline' },
  { id: 'hospital', label: 'Hospital', icon: 'medkit-outline' },
  { id: 'condominio', label: 'Condominio', icon: 'home-outline' },
  { id: 'universidade', label: 'Universidade', icon: 'library-outline' },
  { id: 'shopping', label: 'Shopping', icon: 'cart-outline' },
];

// Vehicle Score (seccao 33 do documento): nota de 1 a 5 em seguranca, conforto
// e limpeza, atribuida ao veiculo/motorista. E informativo para o passageiro
// escolher com mais confianca - nunca influencia o preco fixo da viagem.
/**
 * AngoTour Ela (seccao 42-43 do documento): quando o passageiro ativa o Modo
 * Mulher, o matching prioriza uma motorista mulher, se disponivel. Nunca
 * exclui motoristas homens quando nao ha nenhuma mulher disponivel - apenas
 * prioriza, nao bloqueia.
 */
/**
 * ETA Real (seccao 17 do documento): o tempo ate o motorista chegar nao e
 * uma estimativa falsamente precisa - varia com o transito e a hora do dia.
 * Em horas de ponta (7h-9h e 17h-19h) aplicamos um fator de transito.
 *
 * IMPORTANTE: isto afeta APENAS o ETA mostrado (tempo de espera). Nunca
 * influencia o preco - o preco fixo e calculado uma unica vez no momento da
 * escolha e fica protegido apos a confirmacao (ver estimateTrip abaixo).
 */
export function computeRealEta(baseEtaMinutes: number, date: Date = new Date()): number {
  const hour = date.getHours();
  const isPeakHour = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
  const trafficMultiplier = isPeakHour ? 1.6 : 1;
  return Math.max(baseEtaMinutes, Math.round(baseEtaMinutes * trafficMultiplier));
}

/**
 * Calculo de preco fixo e transparente.
 *
 * preco = tarifaBaseKz + (distanciaKm * precoPorKmKz) + (duracaoEstimadaMin * precoPorMinKz)
 * com piso na tarifaMinimaKz, arredondado aos 50 Kz.
 *
 * Sem sobretaxas dinamicas por procura ("surge"): o valor calculado aqui e sempre o valor
 * final apresentado ao passageiro. Uma vez confirmada a viagem, este preco fica gravado no
 * TripRequest e nunca e recalculado - mesmo que o trajeto real demore mais por transito ou
 * desvio do motorista. O risco dessa diferenca fica do lado da AngoTour, nao do passageiro.
 */
export function estimateTrip(distanceKm: number, categoryId: VehicleCategoryId) {
  const category = vehicleCategories.find((c) => c.id === categoryId) ?? vehicleCategories[0];

  const durationMinutes = Math.round((distanceKm / category.velocidadeMediaKmh) * 60);
  const distanceCostKz = Math.round(distanceKm * category.precoPorKmKz);
  const durationCostKz = Math.round(durationMinutes * category.precoPorMinKz);
  const subtotalKz = category.tarifaBaseKz + distanceCostKz + durationCostKz;

  const tarifaMinimaAplicada = subtotalKz < category.tarifaMinimaKz;
  const beforeRounding = tarifaMinimaAplicada ? category.tarifaMinimaKz : subtotalKz;
  const finalPriceKz = Math.round(beforeRounding / 50) * 50;

  const etaMinutes = computeRealEta(category.etaMinutes);

  const breakdown: PriceBreakdown = {
    tarifaBaseKz: category.tarifaBaseKz,
    distanceKm,
    distanceCostKz,
    durationMinutes,
    durationCostKz,
    subtotalKz,
    tarifaMinimaKz: category.tarifaMinimaKz,
    tarifaMinimaAplicada,
    finalPriceKz,
  };

  return { priceKz: finalPriceKz, etaMinutes, durationMinutes, category, breakdown };
}

// Preco Decrescente: enquanto procura motorista, o valor mostrado ao
// passageiro desce a cada intervalo, ate um limite minimo por categoria.
// O motorista recebe sempre o preco original na integra - a diferenca e
// absorvida pela margem da AngoTour nessa viagem. Nunca sobe (sem surge).
export const DECREASING_PRICE_STEP_KZ = 100;
export const DECREASING_PRICE_INTERVAL_MS = 6000;
export const DECREASING_PRICE_MIN_RATIO = 0.9; // nunca desce mais de 10% do preco original

export interface TripHistoryEntry {
  id: string;
  dateIso: string;
  originLabel: string;
  destinationLabel: string;
  distanceKm: number;
  priceKz: number;
  categoryId: VehicleCategoryId;
  driverName: string;
  status: 'completed' | 'cancelled';
  rating?: number;
}

export const tripHistory: TripHistoryEntry[] = [
  { id: 'th1', dateIso: '2026-09-26T08:12:00', originLabel: 'Talatona, Luanda', destinationLabel: 'Maianga, Luanda', distanceKm: 9.4, priceKz: 3660, categoryId: 'ango_taxi', driverName: 'Joao Manuel', status: 'completed', rating: 5 },
  { id: 'th2', dateIso: '2026-09-23T18:40:00', originLabel: 'Talatona, Luanda', destinationLabel: 'Aeroporto 4 de Fevereiro', distanceKm: 11.5, priceKz: 5925, categoryId: 'ango_aeroporto', driverName: 'Carlos Fernandes', status: 'completed', rating: 4 },
  { id: 'th3', dateIso: '2026-09-10T13:05:00', originLabel: 'Belas Shopping', destinationLabel: 'Marginal de Luanda', distanceKm: 14.2, priceKz: 7100, categoryId: 'ango_conforto', driverName: 'Ana Beatriz', status: 'cancelled' },
  { id: 'th4', dateIso: '2026-08-28T07:50:00', originLabel: 'Talatona, Luanda', destinationLabel: 'Ingombota, Luanda', distanceKm: 12.1, priceKz: 4719, categoryId: 'ango_taxi', driverName: 'Joao Manuel', status: 'completed', rating: 5 },
  { id: 'th5', dateIso: '2026-08-14T20:15:00', originLabel: 'Maianga, Luanda', destinationLabel: 'Talatona, Luanda', distanceKm: 9.0, priceKz: 4500, categoryId: 'ango_family', driverName: 'Carlos Fernandes', status: 'completed', rating: 4 },
];

// AngoPoints - catalogo de recompensas (seccao 19, 22, 64-65 do documento):
// liga a fidelizacao do passageiro ao ecossistema de turismo AngoTour.
// Metodos de pagamento (seccao 14 do documento): partilhados entre
// WalletScreen e PaymentMethodModal.
export const paymentMethods: PaymentMethod[] = [
  { id: 'pm1', type: 'wallet', label: 'Carteira AngoTour', isDefault: true },
  { id: 'pm2', type: 'multicaixa_express', label: 'Multicaixa Express', isDefault: false },
  { id: 'pm3', type: 'unitel_money', label: 'Unitel Money', isDefault: false },
  { id: 'pm4', type: 'cash', label: 'Dinheiro', isDefault: false },
];

// Troco Inteligente (seccao 27-28 do documento): notas comuns em Angola.
// Ao escolher pagamento em dinheiro, o passageiro diz com que nota vai pagar
// e calculamos o troco necessario - evita a discussao classica "nao tenho
// troco" no fim da viagem.
export const CASH_NOTES_KZ = [1000, 2000, 5000, 10000, 20000];

export function computeChangeKz(priceKz: number, noteKz: number): number {
  return Math.max(0, noteKz - priceKz);
}


// AC garantido por categoria (seccao 30-31 do documento): elimina a
// negociacao de ar condicionado dentro do carro - e uma caracteristica fixa
// da categoria, escolhida antes, nao um pedido no momento.
export const CATEGORY_AC_GUARANTEED: Record<VehicleCategoryId, boolean> = {
  ango_taxi: false,
  ango_conforto: true,
  ango_executivo: true,
  ango_family: true,
  ango_moto: false,
  ango_grupo: true,
  ango_aeroporto: true,
  ango_tour: true,
  ango_acessivel: true,
  ango_cavalo: false,
  ango_bruxa: false,
  ango_tapete: false,
};
