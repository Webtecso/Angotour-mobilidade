// Ajudantes para sincronizar com o servidor sem nunca bloquear nem partir a app.
export function withTimeout<T>(promise: Promise<T>, ms = 4000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

/** Dispara em segundo plano e ignora qualquer falha (offline, sem sessao, servidor em baixo). */
export function syncQuiet(task: () => Promise<unknown>): void {
  withTimeout(task()).catch(() => {});
}
