import { SafeReturn, SafeAsyncReturn, SafeUtilOptions, RetryOptions } from './types';
import { from, Observable } from 'rxjs';
import { calculateDelay, normalizeError, safeTimeout } from './utils';

/**
 * Creates a set of utility functions for handling errors in synchronous and asynchronous code.
 * @param {SafeUtilOptions} deps - Optional dependencies for configuring the utilities.
 *   - `enableLogErrors`: Whether to log errors (default: true)
 *   - `logger`: Custom error logger function (default: console.error)
 * @returns {Object} An object containing the utility functions.
 * @author Andreas Nicolaou
 */
export const createSafeUtils = (
  deps: SafeUtilOptions = Object.create(Object.prototype)
): {
  safe: <T>(fn: () => T) => SafeReturn<T>;
  safeAsync: <T>(fn: () => Promise<T>) => SafeAsyncReturn<T>;
  safeAll: <T>(promises: Promise<T>[]) => Promise<SafeReturn<T>[]>;
  safeObservable: <T>(fn: () => T | Promise<T>) => Observable<T>;
  safeObservableAll: <T>(promises: Promise<T>[]) => Observable<[Error | null, T | undefined][]>;
  safeWithRetries: <T>(
    fn: () => Promise<T>,
    options: RetryOptions & {
      timeoutMs?: number;
    }
  ) => SafeAsyncReturn<T>;
} => {
  const { enableLogErrors = true, logger = console.error } = deps;

  /**
   * Executes a function safely, returning a tuple of error and result.
   * @param {Function} fn - The function to execute.
   * @returns {SafeReturn<T>} A tuple containing an error (if any) and the result.
   *   - error: null if successful, Error if failed
   *   - result: function return value if successful, undefined if failed
   * @example
   * const [err, data] = safe(() => JSON.parse(input));
   */
  const safe = <T>(fn: () => T): SafeReturn<T> => {
    try {
      return [null, fn()];
    } catch (error) {
      const normalizedError = normalizeError(error);
      if (enableLogErrors) {
        logger(normalizedError);
      }
      return [normalizedError, undefined];
    }
  };

  /**
   * Executes an asynchronous function safely, returning a promise of a tuple of error and result.
   * @param {Function} fn - The asynchronous function to execute.
   * @returns {SafeAsyncReturn<T>} A promise that resolves to a tuple containing an error (if any) and the result.
   *   - error: null if successful, Error if failed
   *   - result: function return value if successful, undefined if failed
   * @example
   * const [err, data] = await safeAsync(() => fetch(url));
   */
  const safeAsync = async <T>(fn: () => Promise<T>): SafeAsyncReturn<T> => {
    try {
      return [null, await fn()];
    } catch (error) {
      const normalizedError = normalizeError(error);
      if (enableLogErrors) {
        logger(normalizedError);
      }
      return [normalizedError, undefined];
    }
  };

  /**
   * Executes multiple promises safely, returning a promise of an array of tuples of error and result.
   * @param {Promise[]} promises - The array of promises to execute.
   * @returns {Promise<SafeReturn<T>[]>} A promise that resolves to an array of tuples containing errors (if any) and results.
   *   - error: null if successful, Error if failed
   *   - result: function return value if successful, undefined if failed
   * @example
   * const results = await safeAll([fetch(url1), fetch(url2)]);
   */
  const safeAll = async <T>(promises: Promise<T>[]): Promise<SafeReturn<T>[]> => {
    return Promise.all(
      promises.map(async (promise) => {
        try {
          return [null, await promise] as SafeReturn<T>;
        } catch (error) {
          const normalizedError = normalizeError(error);
          if (enableLogErrors) {
            logger(normalizedError);
          }
          return [normalizedError, undefined] as SafeReturn<T>;
        }
      })
    );
  };

  /**
   * Executes a function that returns an observable safely, returning an observable of the result.
   * @param {Function} fn - The function to execute.
   * @returns {Observable<T>} An observable that emits the result or an error.
   * @example
   * const obs$ = safeObservable(() => fetch(url));
   */
  const safeObservable = <T>(fn: () => T | Promise<T>): Observable<T> => {
    return new Observable<T>((subscriber) => {
      try {
        const result = fn();
        if (result instanceof Promise) {
          result
            .then((data) => {
              subscriber.next(data);
              subscriber.complete();
            })
            .catch((error) => {
              const normalizedError = normalizeError(error);
              if (enableLogErrors) {
                logger(normalizedError);
              }
              subscriber.error(normalizedError);
            });
        } else {
          subscriber.next(result);
          subscriber.complete();
        }
      } catch (error) {
        const normalizedError = normalizeError(error);
        if (enableLogErrors) {
          logger(normalizedError);
        }
        subscriber.error(normalizedError);
      }
    });
  };

  /**
   * Executes multiple promises that return observables safely, returning an observable of an array of tuples of error and result.
   * @param {Promise[]} promises - The array of promises to execute.
   * @returns {Observable<[Error | null, T | undefined][]>} An observable that emits an array of tuples containing errors (if any) and results.
   *   - error: null if successful, Error if failed
   *   - result: function return value if successful, undefined if failed
   * @example
   * const obs$ = safeObservableAll([fetch(url1), fetch(url2)]);
   */
  const safeObservableAll = <T>(promises: Promise<T>[]): Observable<[Error | null, T | undefined][]> => {
    return from(
      Promise.all(
        promises.map((promise) =>
          promise
            .then((data) => [null, data] as [null, T])
            .catch((error) => {
              const normalizedError = normalizeError(error);
              if (enableLogErrors) {
                logger(normalizedError);
              }
              return [normalizedError, undefined] as [Error, undefined];
            })
        )
      )
    );
  };

  /**
   * Executes a function with retries, returning a promise of a tuple of error and result.
   * @param {Function} fn - The asynchronous function to execute.
   * @param {RetryOptions} options - The retry options.
   * @returns {SafeAsyncReturn<T>} A promise that resolves to a tuple containing an error (if any) and the result.
   *   - error: null if successful, Error if failed
   *   - result: function return value if successful, undefined if failed
   * @example
   * const [err, data] = await safeWithRetries(() => fetch(url), { retries: 3 });
   */
  const safeWithRetries = async <T>(
    fn: () => Promise<T>,
    options: RetryOptions & { timeoutMs?: number }
  ): SafeAsyncReturn<T> => {
    let normalizedError: Error | null = null;
    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        const result = await (options.timeoutMs ? safeTimeout(fn(), options.timeoutMs) : fn());
        return [null, result];
      } catch (error) {
        normalizedError = normalizeError(error);
        if (enableLogErrors) {
          logger(normalizedError);
        }
        if (attempt < options.retries) {
          const delay = calculateDelay(attempt, options);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    return [normalizedError, undefined];
  };

  return { safe, safeAsync, safeAll, safeObservable, safeObservableAll, safeWithRetries };
};
