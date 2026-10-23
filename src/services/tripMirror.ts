import { TripRequest } from '../types';
import { tripsApi, RemoteDriver, RemoteVehicle } from './api';

/**
 * A viagem continua 100% local (UI responde na hora com um motorista mock).
 * Em paralelo, o servidor regista a viagem a serio e atribui um motorista
 * real da tabela drivers. Quando essa resposta chega, onRealDriverAssigned
 * e chamado para corrigir os dados mostrados ao passageiro (nome, avaliacao,
 * telefone e localizacao reais) - sem bloquear nem atrasar a UI inicial.
 */
interface Mirror {
  chain: Promise<unknown>;
  remoteId?: string;
  started?: boolean;
  finished?: boolean;
}

export interface RealDriverAssignment {
  driver: RemoteDriver;
  driverLocation: { latitude: number; longitude: number } | null;
  // Codigo de embarque real, gerado pelo servidor no create() - e o unico
  // que driverConfirmBoarding aceita do lado do motorista.
  boardingCode?: string;
  // Veiculo aprovado do motorista (null para motoristas demo).
  vehicle?: RemoteVehicle | null;
  // Id da viagem no servidor (e o que identifica a sala do socket).
  remoteId?: string;
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

export function mirrorCreateAndAssign(
  trip: TripRequest,
  preferFemale: boolean,
  onRealDriverAssigned?: (localTripId: string, assignment: RealDriverAssignment) => void
): void {
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
      const assigned = await tripsApi.assignDriver(created.id, assignOpts);

      if (assigned.driver && onRealDriverAssigned) {
        onRealDriverAssigned(trip.id, {
          driver: assigned.driver,
          driverLocation: assigned.driverLocation ?? null,
          boardingCode: assigned.boardingCode ?? created.boardingCode,
          remoteId: created.id,
          vehicle: assigned.vehicle ?? null,
        });
      }
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


