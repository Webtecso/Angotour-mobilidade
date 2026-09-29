export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PreferredLanguage = 'pt' | 'en';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  photoUrl?: string;
  preferredLanguage: PreferredLanguage;
  isVerified: boolean;
  angoPoints: number;
  createdAt: string;
}

export type PlaceKind = 'home' | 'work' | 'university' | 'airport' | 'favorite' | 'recent' | 'custom';

export interface SavedPlace {
  id: string;
  kind: PlaceKind;
  label: string;
  address: string;
  coordinates: Coordinates;
  reference?: string;
  // Local Point (seccao 19-20 do documento): foto tirada pelo passageiro como
  // referencia visual do local de recolha ou destino, para alem do texto.
  referencePhotoUri?: string;
}

// Base de Referencias Angolanas (seccao 20 do documento): categorias comuns
// sugeridas ao passageiro enquanto escreve o ponto de referencia, ja que
// muitos locais em Angola nao tem endereco formal.
export interface ReferenceCategory {
  id: string;
  label: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
}

export type VehicleCategoryId =
  | 'ango_taxi'
  | 'ango_conforto'
  | 'ango_executivo'
  | 'ango_family'
  | 'ango_grupo'
  | 'ango_aeroporto'
  | 'ango_tour'
  | 'ango_moto'
  | 'ango_acessivel';

export interface VehicleCategory {
  id: VehicleCategoryId;
  name: string;
  description: string;
  icon: keyof typeof import('@expo/vector-icons/MaterialCommunityIcons').default.glyphMap;
  // Modelo de preco fixo e transparente - sem sobretaxas dinamicas por procura ("surge").
  // preco = tarifaBaseKz + (distanciaKm * precoPorKmKz) + (duracaoEstimadaMin * precoPorMinKz)
  // com piso na tarifaMinimaKz. O valor calculado no momento da escolha fica protegido
  // apos a confirmacao da viagem - nao e recalculado mesmo que o trajeto real demore mais.
  // O ETA (tempo ate o motorista chegar) pode variar com o transito/hora do dia -
  // isso NUNCA afeta o preco, apenas a estimativa de espera mostrada ao passageiro.
  tarifaBaseKz: number;
  precoPorKmKz: number;
  precoPorMinKz: number;
  tarifaMinimaKz: number;
  velocidadeMediaKmh: number;
  etaMinutes: number;
  capacity: number;
}

export interface PriceBreakdown {
  tarifaBaseKz: number;
  distanceKm: number;
  distanceCostKz: number;
  durationMinutes: number;
  durationCostKz: number;
  subtotalKz: number;
  tarifaMinimaKz: number;
  tarifaMinimaAplicada: boolean;
  finalPriceKz: number;
}

export type TripStatus =
  | 'idle'
  | 'searching_driver'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Vehicle Score (seccao 33 do documento): indicadores de qualidade do
// veiculo/motorista, numa escala de 1 a 5. Informativo para o passageiro -
// nao afeta o preco.
export interface VehicleScore {
  safety: number;
  comfort: number;
  cleanliness: number;
}

export interface Driver {
  coordinates: Coordinates;
  id: string;
  fullName: string;
  photoUrl?: string;
  rating: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  phone: string;
  vehicleScore: VehicleScore;
  gender: 'male' | 'female';
}

// Preferencias de conforto (seccao 8 do documento): escolhidas antes de
// confirmar a viagem, mostradas ao motorista como pedido especial.
export type ComfortPreferenceId = 'silent' | 'no_music' | 'luggage_help';

export interface TripRequest {
  id: string;
  origin: SavedPlace;
  destination: SavedPlace;
  stops: SavedPlace[];
  categoryId: VehicleCategoryId;
  distanceKm: number;
  durationMinutes: number;
  etaMinutes: number;
  priceKz: number;
  priceBreakdown: PriceBreakdown;
  scheduledFor?: string;
  requestedForSomeoneElse?: { name: string; phone: string };
  status: TripStatus;
  driver?: Driver;
  boardingCode?: string;
  comfortPreferences?: ComfortPreferenceId[];
  // Dividir pagamento (seccao 14): quando > 1, o valor da viagem e dividido
  // entre este numero de pessoas. Nao altera o preco fixo total da viagem.
  splitCount?: number;
  // Preco Decrescente: preco original mostrado no momento da confirmacao.
  // Se a busca por motorista demorar, o valor cobrado pode descer ate um
  // limite - mas o motorista recebe sempre originalPriceKz na integra.
  // A diferenca e absorvida pela margem da AngoTour nessa viagem.
  originalPriceKz?: number;
  // Airport Mode (seccao 41): detalhes de recolha quando o destino/origem
  // e o aeroporto - reduz ambiguidade e risco de extorsao no local.
  airportPickup?: { terminal: string; pickupPoint: string };
  // Selo de Trajeto Limpo: distancia real percorrida (rota OSRM), preenchida
  // ao concluir a viagem. Comparada com distanceKm (ideal) para o selo.
  actualDistanceKm?: number;
  // Estado real do pagamento (seccao 29): simulado no TripCompletedScreen.
  paymentState?: PaymentState;
  // Metodo de pagamento e Troco Inteligente (seccao 27-29 do documento):
  // guardados no momento da confirmacao da viagem.
  paymentMethodType: PaymentMethodType;
  remoteId?: string;
  cashNoteKz?: number;
  changeKz?: number;
}

// Estado real do pagamento (seccao 29 do documento): nunca assumir
// pagamento instantaneo - o passageiro ve o estado real da transacao.
export type PaymentState = 'processing' | 'confirmed' | 'failed';

export type PaymentMethodType = 'wallet' | 'multicaixa_express' | 'unitel_money' | 'card' | 'cash';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  isDefault: boolean;
}

export interface QuickShortcut {
  id: string;
  label: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
  place?: SavedPlace;
}




