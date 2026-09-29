import { priceChangesRemote } from './extrasApi';
import { withTimeout } from './remoteSync';

// Propostas pendentes por viagem (id local). Guarda a promessa do id devolvido pelo
// servidor, para aceitar/reportar mesmo que a resposta ainda esteja a chegar.
const pending = new Map<string, Promise<string | null>>();

/** Regista a proposta no servidor em segundo plano. Falhas sao ignoradas. */
export function proposePriceChange(tripRef: string, originalPriceKz: number, proposedPriceKz: number, reason?: string): void {
  const p = withTimeout(
    priceChangesRemote.propose({
      tripRef: tripRef.slice(0, 60),
      originalPriceKz: Math.round(originalPriceKz),
      proposedPriceKz: Math.round(proposedPriceKz),
      reason,
    }),
  )
    .then((r) => r.id)
    .catch(() => null);
  pending.set(tripRef, p);
}

function resolvePending(tripRef: string, action: (id: string) => Promise<unknown>): void {
  const p = pending.get(tripRef);
  if (!p) return;
  pending.delete(tripRef);
  p.then((id) => (id ? withTimeout(action(id)) : undefined)).catch(() => {});
}

export function reportPriceChange(tripRef: string): void {
  resolvePending(tripRef, (id) => priceChangesRemote.report(id));
}

