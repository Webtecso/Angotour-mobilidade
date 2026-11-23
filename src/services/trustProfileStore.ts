import type { TripHistoryEntry } from './mockData';

export interface TrustProfileSummary {
  completedTrips: number;
  cancelledTrips: number;
  totalKm: number;
  cancellationRate: number;
}

/**
 * Perfil de Confianca do Passageiro: calculado a partir das viagens reais do
 * utilizador (GET /trips/me). Nunca usa dados de exemplo.
 */
export function summarizeTrust(history: TripHistoryEntry[]): TrustProfileSummary {
  const completed = history.filter((t) => t.status === 'completed');
  const cancelled = history.filter((t) => t.status === 'cancelled');
  const totalKm = completed.reduce((sum, t) => sum + (Number(t.distanceKm) || 0), 0);
  const total = completed.length + cancelled.length;
  return {
    completedTrips: completed.length,
    cancelledTrips: cancelled.length,
    totalKm,
    cancellationRate: total > 0 ? cancelled.length / total : 0,
  };
}