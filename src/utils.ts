import { RetryOptions } from './types';

export const normalizeError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

/**
 * Clamps a caller supplied retry count to a usable number of retries.
 * Guards against negative, fractional and non-numeric values (a plain JS caller
 * can omit `retries` entirely) so the retry loop always runs at least once.
 * Numeric strings (e.g. read from config or env) are coerced, as the old loop did.
 * `Infinity` is kept as-is and means "retry until success".
 */
export const normalizeRetries = (retries: number): number => {
  const count = Number(retries);
  if (count === Infinity) {
    return Infinity;
  }
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
};

export const calculateDelay = (attempt: number, options: RetryOptions): number => {
  const { initialDelayMs = 100, jitter = false, maxDelayMs = 30_000 } = options;
  const baseDelay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
  if (jitter) {
    return Math.random() * baseDelay;
  }
  return baseDelay;
};

export const safeTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  // Without this the pending timer keeps the event loop alive for the full `ms`
  // even when `promise` already settled.
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
