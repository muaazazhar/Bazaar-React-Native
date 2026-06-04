type PendingTask = {
  id: string;
  promise: Promise<void>;
};

const pendingTasks = new Map<string, PendingTask>();
const listeners = new Set<() => void>();

function emitPendingChange() {
  listeners.forEach((listener) => listener());
}

export function subscribePendingSessionTasks(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingSessionTaskCount(): number {
  return pendingTasks.size;
}

export function isDrainingSessionTasks(): boolean {
  return draining;
}

let draining = false;

/**
 * Runs work that must finish before logout (e.g. receipt generation after checkout).
 * Duplicate ids replace the previous task.
 */
export function registerPendingSessionTask(id: string, run: () => Promise<void>): Promise<void> {
  const existing = pendingTasks.get(id);
  if (existing) {
    return existing.promise;
  }

  const promise = run()
    .catch(() => {
      // Task failures should not block logout forever.
    })
    .finally(() => {
      pendingTasks.delete(id);
      emitPendingChange();
    });

  pendingTasks.set(id, { id, promise });
  emitPendingChange();
  return promise;
}

export async function waitForPendingSessionTasks(timeoutMs = 45_000): Promise<void> {
  if (pendingTasks.size === 0) {
    return;
  }

  draining = true;
  emitPendingChange();

  try {
    const promises = [...pendingTasks.values()].map((task) => task.promise);
    await Promise.race([
      Promise.allSettled(promises),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } finally {
    draining = false;
    emitPendingChange();
  }
}
