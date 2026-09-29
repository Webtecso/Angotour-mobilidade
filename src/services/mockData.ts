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

export const quickShortcuts: QuickShortcut[] = [
  {
    id: 'home', label: 'Casa', icon: 'home-outline',
    place: { id: 'place-home', kind: 'home', label: 'Casa', address: 'Talatona, Luanda', coordinates: { latitude: -8.9302, longitude: 13.1935 } },
  },
  {
    id: 'work', label: 'Trabalho', icon: 'briefcase-outline',
    place: { id: 'place-work', kind: 'work', label: 'Trabalho', address: 'Maianga, Luanda', coordinates: { latitude: -8.8137, longitude: 13.2302 } },
  },
  {
    id: 'airport', label: 'Aeroporto', icon: 'airplane-outline',
    place: { id: 'place-airport', kind: 'airport', label: 'Aeroporto 4 de Fevereiro', address: 'Luanda', coordinates: { latitude: -8.8584, longitude: 13.2312 } },
  },
];

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

export interface SuggestedTrip {
  id: string;
  title: string;
  destination: SavedPlace;
  distanceKm: number;
  durationMinutes: number;
}

export const suggestedTrips: SuggestedTrip[] = [
  {
    id: 'sug-airport', title: 'Aeroporto 4 de Fevereiro', distanceKm: 11.5, durationMinutes: 12,
    destination: { id: 'sug-place-airport', kind: 'airport', label: 'Aeroporto 4 de Fevereiro', address: 'Luanda', coordinates: { latitude: -8.8584, longitude: 13.2312 } },
  },
  {
    id: 'sug-talatona', title: 'Talatona', distanceKm: 8.2, durationMinutes: 8,
    destination: { id: 'sug-place-talatona', kind: 'custom', label: 'Talatona', address: 'Talatona, Luanda', coordinates: { latitude: -8.9302, longitude: 13.1935 } },
  },
];

// Vehicle Score (seccao 33 do documento): nota de 1 a 5 em seguranca, conforto
// e limpeza, atribuida ao veiculo/motorista. E informativo para o passageiro
// escolher com mais confianca - nunca influencia o preco fixo da viagem.
export const mockDrivers: Driver[] = [
  { id: 'drv-1', fullName: 'João Manuel', rating: 4.9, vehicleModel: 'Toyota Corolla', vehiclePlate: 'LD-23-GH', vehicleColor: 'Branco', phone: '+244923000111', coordinates: { latitude: -8.9155, longitude: 13.1802 }, vehicleScore: { safety: 5, comfort: 4, cleanliness: 5 }, gender: 'male' },
  { id: 'drv-2', fullName: 'Carlos Fernandes', rating: 4.8, vehicleModel: 'Hyundai Accent', vehiclePlate: 'LD-45-KM', vehicleColor: 'Prateado', phone: '+244923000222', coordinates: { latitude: -8.9280, longitude: 13.1955 }, vehicleScore: { safety: 4, comfort: 4, cleanliness: 4 }, gender: 'male' },
  { id: 'drv-3', fullName: 'Ana Beatriz', rating: 5.0, vehicleModel: 'Kia Rio', vehiclePlate: 'LD-67-TP', vehicleColor: 'Azul', phone: '+244923000333', coordinates: { latitude: -8.9190, longitude: 13.1750 }, vehicleScore: { safety: 5, comfort: 5, cleanliness: 5 }, gender: 'female' },
];

export function getRandomDriver(): Driver {
  return mockDrivers[Math.floor(Math.random() * mockDrivers.length)];
}

/**
 * AngoTour Ela (seccao 42-43 do documento): quando o passageiro ativa o Modo
 * Mulher, o matching prioriza uma motorista mulher, se disponivel. Nunca
 * exclui motoristas homens quando nao ha nenhuma mulher disponivel - apenas
 * prioriza, nao bloqueia.
 */
export function chooseDriver(preferFemale = false, preferredDriverId?: string): Driver {
  // Motorista preferido: se o passageiro marcou um motorista como favorito
  // e ele e compativel com o Modo Mulher (quando ativo), tenta atribui-lo
  // primeiro - nunca bloqueia o matching se ele nao estiver "disponivel".
  if (preferredDriverId) {
    const preferred = mockDrivers.find((d) => d.id === preferredDriverId);
    if (preferred && (!preferFemale || preferred.gender === 'female')) {
      return preferred;
    }
  }
  if (preferFemale) {
    const femaleDrivers = mockDrivers.filter((d) => d.gender === 'female');
    if (femaleDrivers.length > 0) {
      return femaleDrivers[Math.floor(Math.random() * femaleDrivers.length)];
    }
  }
  return mockDrivers[Math.floor(Math.random() * mockDrivers.length)];
}

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

export function generateBoardingCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const mockAssignedDriver: Driver = {
  id: 'driver-mock-1',
  coordinates: { latitude: -8.9155, longitude: 13.1802 },
  fullName: 'Joao Manuel',
  rating: 4.9,
  vehicleModel: 'Toyota Corolla',
  vehiclePlate: 'LD-23-GH',
  vehicleColor: 'Branco',
  phone: '+244923000111',
  vehicleScore: { safety: 5, comfort: 4, cleanliness: 5 },
  gender: 'male',
};

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

export interface WalletTransactionEntry {
  id: string;
  dateIso: string;
  label: string;
  amountKz: number;
  type: 'trip' | 'topup' | 'refund' | 'points';
}

export const walletTransactions: WalletTransactionEntry[] = [
  { id: 'wt1', dateIso: '2026-09-26T08:20:00', label: 'Viagem - Maianga', amountKz: -3660, type: 'trip' },
  { id: 'wt2', dateIso: '2026-09-24T09:00:00', label: 'Carregamento via Multicaixa Express', amountKz: 10000, type: 'topup' },
  { id: 'wt3', dateIso: '2026-09-23T18:48:00', label: 'Viagem - Aeroporto 4 de Fevereiro', amountKz: -5925, type: 'trip' },
  { id: 'wt4', dateIso: '2026-09-10T13:10:00', label: 'Reembolso - viagem cancelada', amountKz: 0, type: 'refund' },
  { id: 'wt5', dateIso: '2026-08-28T07:55:00', label: 'Viagem - Ingombota', amountKz: -4719, type: 'trip' },
];

export interface ConversationEntry {
  id: string;
  driverName: string;
  vehiclePlate: string;
  lastMessage: string;
  dateIso: string;
  unread: boolean;
  status: 'active' | 'support' | 'past';
}

export const conversations: ConversationEntry[] = [
  { id: 'c1', driverName: 'Joao Manuel', vehiclePlate: 'LD-23-GH', lastMessage: 'Estou a chegar, portao azul.', dateIso: '2026-09-27T09:05:00', unread: true, status: 'active' },
  { id: 'c2', driverName: 'Suporte AngoTour', vehiclePlate: '', lastMessage: 'O teu pedido foi resolvido. Obrigado pela paciencia.', dateIso: '2026-09-20T16:30:00', unread: false, status: 'support' },
  { id: 'c3', driverName: 'Carlos Fernandes', vehiclePlate: 'LD-45-KM', lastMessage: 'Obrigado pela viagem!', dateIso: '2026-09-23T19:10:00', unread: false, status: 'past' },
  { id: 'c4', driverName: 'Ana Beatriz', vehiclePlate: 'LD-67-TP', lastMessage: 'Cheguei ao local combinado.', dateIso: '2026-09-10T13:02:00', unread: false, status: 'past' },
];

export interface PopularDestinationInfo {
  id: string;
  title: string;
  address: string;
  coordinates: Coordinates;
  minutes: number;
}

export const popularDestinationsFull: PopularDestinationInfo[] = [
  { id: 'airport', title: 'Aeroporto 4 de Fevereiro', address: 'Luanda', coordinates: { latitude: -8.8584, longitude: 13.2312 }, minutes: 12 },
  { id: 'talatona', title: 'Talatona', address: 'Talatona, Luanda', coordinates: { latitude: -8.9302, longitude: 13.1935 }, minutes: 8 },
  { id: 'maianga', title: 'Maianga', address: 'Maianga, Luanda', coordinates: { latitude: -8.8137, longitude: 13.2302 }, minutes: 15 },
  { id: 'ilha', title: 'Ilha de Luanda', address: 'Ilha do Cabo, Luanda', coordinates: { latitude: -8.7935, longitude: 13.2503 }, minutes: 18 },
  { id: 'kilamba', title: 'Kilamba', address: 'Kilamba, Luanda', coordinates: { latitude: -8.9975, longitude: 13.2564 }, minutes: 22 },
  { id: 'viana', title: 'Viana', address: 'Viana, Luanda', coordinates: { latitude: -8.9038, longitude: 13.3703 }, minutes: 25 },
];

// AngoPoints - catalogo de recompensas (seccao 19, 22, 64-65 do documento):
// liga a fidelizacao do passageiro ao ecossistema de turismo AngoTour.
export interface RewardItem {
  id: string;
  title: string;
  description: string;
  costPoints: number;
  category: 'hotel' | 'restaurante' | 'experiencia' | 'desconto';
}

export const rewardsCatalog: RewardItem[] = [
  { id: 'r1', title: '10% desconto - Hotel Presidente', description: 'Valido para estadias de 1 a 3 noites.', costPoints: 500, category: 'hotel' },
  { id: 'r2', title: 'Sobremesa gratis - Restaurante Miradouro', description: 'Numa refeicao para 2 pessoas.', costPoints: 150, category: 'restaurante' },
  { id: 'r3', title: 'Passeio de barco - Ilha de Luanda', description: '15% de desconto no passeio ao por do sol.', costPoints: 800, category: 'experiencia' },
  { id: 'r4', title: '500 Kz de desconto na proxima viagem', description: 'Aplica automaticamente na tua carteira AngoTour.', costPoints: 300, category: 'desconto' },
  { id: 'r5', title: 'Entrada dupla - Museu Nacional', description: 'Valida por 30 dias apos o resgate.', costPoints: 250, category: 'experiencia' },
];




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
};
