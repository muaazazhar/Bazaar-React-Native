import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type NotificationVariant = 'success' | 'info' | 'warning' | 'error';

export type NotificationAction = {
  label: string;
  onPress: () => void;
};

export type InAppNotification = {
  id: string;
  title: string;
  message: string;
  variant: NotificationVariant;
  durationMs: number;
  action?: NotificationAction;
};

export type NotifyInput = {
  title: string;
  message: string;
  variant?: NotificationVariant;
  durationMs?: number;
  action?: NotificationAction;
};

type NotificationContextValue = {
  current: InAppNotification | null;
  notify: (input: NotifyInput) => void;
  dismiss: (id?: string) => void;
  clearAll: () => void;
};

const DEFAULT_DURATION_MS = 4500;
const ERROR_DURATION_MS = 5500;

const NotificationContext = createContext<NotificationContextValue | null>(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<InAppNotification | null>(null);
  const queueRef = useRef<InAppNotification[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showNext = useCallback(() => {
    clearTimer();
    const next = queueRef.current.shift() ?? null;
    setCurrent(next);
  }, [clearTimer]);

  const dismiss = useCallback(
    (id?: string) => {
      if (id && current?.id !== id) {
        return;
      }
      showNext();
    },
    [current?.id, showNext],
  );

  const clearAll = useCallback(() => {
    clearTimer();
    queueRef.current = [];
    setCurrent(null);
  }, [clearTimer]);

  useEffect(() => {
    if (!current) {
      clearTimer();
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      showNext();
    }, current.durationMs);
    return clearTimer;
  }, [current, clearTimer, showNext]);

  const notify = useCallback((input: NotifyInput) => {
    const variant = input.variant ?? 'info';
    const item: InAppNotification = {
      id: createId(),
      title: input.title,
      message: input.message,
      variant,
      durationMs:
        input.durationMs ??
        (variant === 'error' || variant === 'warning' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS),
      action: input.action,
    };

    setCurrent((active) => {
      if (!active) {
        return item;
      }
      queueRef.current.push(item);
      return active;
    });
  }, []);

  const value = useMemo(
    () => ({
      current,
      notify,
      dismiss,
      clearAll,
    }),
    [current, notify, dismiss, clearAll],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}
