export type SafeReturn<T> = [Error | null, T | undefined];
export type SafeAsyncReturn<T> = Promise<SafeReturn<T>>;

export interface SafeUtilOptions {
  enableLogErrors?: boolean;
  logger?: (error: unknown) => void;
}

export interface RetryOptions {
  retries: number;
  initialDelayMs?: number;
  jitter?: boolean;
}
