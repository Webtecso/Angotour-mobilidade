import { TripRequest } from '../types';
import { tripsApi } from './api';

/**
 * A viagem continua 100% local (UI e motorista simulado iguais). Em paralelo, o servidor
 * regista a viagem para dar historico, pontos e saldo reais. As chamadas correm por ordem
 * (criar -> atribuir -> iniciar -> concluir/cancelar) e qualquer falha e ignorada.
 */
interface Mirror {
  chain: Promise<unknown>;
  remoteId?: string;
  started?: boolean;
  finished?: boolean;
}

const mirrors = new Map<string, Mirror>();

function warn(action: string, error: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`[AngoTour] espelho: ${action} falhou:`, error instanceof Error ? error.message : error);
}

function enqueue(localId: string, action: string, task: (remoteId: string) => Promise<unknown>) {
  const m = mirrors.get(localId);
  if (!m) return;
  m.chain = m.chain
    .then(() => (m.remoteId ? task(m.remoteId) : undefined))
    .catch((e) => warn(action, e));
}

export function mirrorCreateAndAssign(trip: TripRequest, preferFemale: boolean): void {
  if (mirrors.has(trip.id)) return;
  const m: Mirror = { chain: Promise.resolve() };
  mirrors.set(trip.id, m);

  m.chain = m.chain
    .then(async () => {
      const body = {
        origin: {
          label: trip.origin.label,
          address: trip.origin.address,
          latitude: trip.origin.coordinates.latitude,
          longitude: trip.origin.coordinates.longitude,
        },
        destination: {
          label: trip.destination.label,
          address: trip.destination.address,
          latitude: trip.destination.coordinates.latitude,
          longitude: trip.destination.coordinates.longitude,
          reference: trip.destination.reference,
        },
        categoryId: trip.categoryId,
        paymentMethodType: trip.paymentMethodType,
        cashNoteKz: trip.cashNoteKz,
        comfortPreferences: trip.comfortPreferences,
        splitCount: trip.splitCount,
        airportPickup: trip.airportPickup,
        womenMode: preferFemale,
      };
      const created = await tripsApi.create(body);
      m.remoteId = created.id;

      const assignOpts = { preferFemale, preferDriverId: undefined as string | undefined };
      await tripsApi.assignDriver(created.id, assignOpts);
    })
    .catch((e) => warn('criar viagem', e));
}

export function mirrorStart(localId: string): void {
  const m = mirrors.get(localId);
  if (!m || m.started) return;
  m.started = true;
  enqueue(localId, 'iniciar viagem', (id) => tripsApi.start(id));
}

export function mirrorComplete(localId: string, actualDistanceKm?: number): void {
  const m = mirrors.get(localId);
  if (!m || m.finished) return;
  m.finished = true;
  enqueue(localId, 'concluir viagem', (id) => tripsApi.complete(id, actualDistanceKm));
}

export function mirrorCancel(localId: string, reason?: string): void {
  const m = mirrors.get(localId);
  if (!m || m.finished) return;
  m.finished = true;
  enqueue(localId, 'cancelar viagem', (id) => tripsApi.cancel(id, reason));
}
