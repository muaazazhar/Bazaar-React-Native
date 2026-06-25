import { useCallback, useRef } from 'react';

export const DEFAULT_PRESS_DEBOUNCE_MS = 400;

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  debounceMs: number = DEFAULT_PRESS_DEBOUNCE_MS,
): T {
  const callbackRef = useRef(callback);
  const lastInvokedAtRef = useRef(0);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => {
      if (debounceMs <= 0) {
        callbackRef.current(...args);
        return;
      }

      const now = Date.now();
      if (now - lastInvokedAtRef.current < debounceMs) {
        return;
      }

      lastInvokedAtRef.current = now;
      callbackRef.current(...args);
    }) as T,
    [debounceMs],
  );
}
