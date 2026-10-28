export type SafeReturn<T> = [Error | null, T | undefined];
export type SafeAsyncReturn<T> = Promise<SafeReturn<T>>;

export interface SafeUtilOptions {
  enableLogErrors?: boolean;
  logger?: (error: unknown) => void;
}

export interface RetryOptions {
  /** Extra attempts after the first one. `Infinity` retries until success. */
  retries: number;
  initialDelayMs?: number;
  /** Upper bound for a single backoff delay, so exponential growth cannot run away. Defaults to 30000ms. */
  maxDelayMs?: number;
  jitter?: boolean;
}
