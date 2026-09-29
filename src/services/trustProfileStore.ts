import { tripHistory } from './mockData';

export interface TrustProfileSummary {
  completedTrips: number;
  cancelledTrips: number;
  averageRating: number;
  cancellationRate: number;
}

/**
 * Perfil de Confianca do Passageiro (seccao 67 do documento de pesquisa):
 * mostra ao proprio passageiro a sua pontuacao - viagens concluidas,
 * cancelamentos e avaliacao media - com base no historico local (mock).
 * Numa fase seguinte isto viria do backend (Passenger Trust Profile).
 */
export function getTrustProfileSummary(): TrustProfileSummary {
  const completed = tripHistory.filter((t) => t.status === 'completed');
  const cancelled = tripHistory.filter((t) => t.status === 'cancelled');
  const ratings = completed.map((t) => t.rating).filter((r): r is number => typeof r === 'number');

  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 5;
  const total = completed.length + cancelled.length;
  const cancellationRate = total > 0 ? cancelled.length / total : 0;

  return {
    completedTrips: completed.length,
    cancelledTrips: cancelled.length,
    averageRating,
    cancellationRate,
  };
}
