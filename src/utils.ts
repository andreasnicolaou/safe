import { RetryOptions } from './types';

export const normalizeError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

export const calculateDelay = (attempt: number, options: RetryOptions): number => {
  const { initialDelayMs = 100, jitter = false } = options;
  const baseDelay = initialDelayMs * Math.pow(2, attempt);
  if (jitter) {
    return Math.random() * baseDelay;
  }
  return baseDelay;
};

export const safeTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms));
  return Promise.race([promise, timeout]);
};
