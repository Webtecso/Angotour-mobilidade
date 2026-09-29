/**
 * Selo de Trajeto Limpo: compara a distancia real percorrida (obtida da
 * rota OSRM usada no LiveRouteMapView) com a distancia ideal calculada no
 * momento da escolha da categoria. Se o desvio for pequeno, a viagem
 * recebe um selo de confianca - sem penalizar ninguem, apenas construindo
 * um historico de confianca visivel ao passageiro (Trusted Trip Rate,
 * seccao 91 do documento, tornado pessoal em vez de so metrica interna).
 */

const CLEAN_ROUTE_TOLERANCE_RATIO = 1.15; // ate 15% acima da distancia ideal ainda conta como "limpo"

export interface RouteIntegrityResult {
  isClean: boolean;
  idealDistanceKm: number;
  actualDistanceKm: number;
  deviationPercent: number;
}

export function evaluateRouteIntegrity(idealDistanceKm: number, actualDistanceKm: number): RouteIntegrityResult {
  const deviationPercent = idealDistanceKm > 0
    ? Math.round(((actualDistanceKm - idealDistanceKm) / idealDistanceKm) * 100)
    : 0;
  const isClean = actualDistanceKm <= idealDistanceKm * CLEAN_ROUTE_TOLERANCE_RATIO;
  return { isClean, idealDistanceKm, actualDistanceKm, deviationPercent };
}
