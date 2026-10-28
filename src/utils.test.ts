import { safeTimeout, normalizeError, normalizeRetries, calculateDelay } from './utils';
jest.useFakeTimers();

describe('utils', () => {
  test('safeTimeout should resolve if the promise completes in time', async () => {
    const fastPromise = new Promise((resolve) => setTimeout(() => resolve('fast'), 500));
    const testPromise = expect(safeTimeout(fastPromise, 1000)).resolves.toBe('fast');
    jest.runAllTimers();
    await testPromise;
  });

  test('safeTimeout should reject if the promise takes too long', async () => {
    const slowPromise = new Promise((resolve) => setTimeout(() => resolve('slow'), 2000));
    const testPromise = expect(safeTimeout(slowPromise, 1000)).rejects.toThrow('Timeout after 1000ms');
    jest.runAllTimers();
    await testPromise;
  });

  test('safeTimeout should clear its timer once the promise wins the race', async () => {
    const before = jest.getTimerCount();
    await expect(safeTimeout(Promise.resolve('fast'), 60_000)).resolves.toBe('fast');
    // A leaked timer would keep the event loop alive for the full 60s.
    expect(jest.getTimerCount()).toBe(before);
  });

  test('safeTimeout should leave no timer behind after it rejects', async () => {
    const before = jest.getTimerCount();
    const neverSettles = new Promise<string>(() => undefined);
    const pending = safeTimeout(neverSettles, 1000);
    jest.advanceTimersByTime(1000);
    await expect(pending).rejects.toThrow('Timeout after 1000ms');
    expect(jest.getTimerCount()).toBe(before);
  });

  test('normalizeRetries should clamp unusable retry counts to zero', () => {
    expect(normalizeRetries(-1)).toBe(0);
    expect(normalizeRetries(undefined as unknown as number)).toBe(0);
    expect(normalizeRetries(NaN)).toBe(0);
    expect(normalizeRetries(-Infinity)).toBe(0);
    expect(normalizeRetries(2.7)).toBe(2);
    expect(normalizeRetries(3)).toBe(3);
  });

  test('normalizeRetries should coerce numeric strings from untyped callers', () => {
    expect(normalizeRetries('3' as unknown as number)).toBe(3);
    expect(normalizeRetries('abc' as unknown as number)).toBe(0);
  });

  test('normalizeRetries should keep Infinity as unlimited retries', () => {
    expect(normalizeRetries(Infinity)).toBe(Infinity);
  });

  test('calculateDelay should grow exponentially but stay under maxDelayMs', () => {
    expect(calculateDelay(0, { retries: 5, initialDelayMs: 100 })).toBe(100);
    expect(calculateDelay(2, { retries: 5, initialDelayMs: 100 })).toBe(400);
    // Uncapped this would be ~14.5 hours.
    expect(calculateDelay(19, { retries: 20, initialDelayMs: 100 })).toBe(30_000);
    expect(calculateDelay(10, { retries: 20, initialDelayMs: 100, maxDelayMs: 500 })).toBe(500);
  });

  test('calculateDelay should keep jittered delays within the cap', () => {
    for (let attempt = 0; attempt < 25; attempt++) {
      const delay = calculateDelay(attempt, { retries: 25, initialDelayMs: 100, jitter: true });
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(30_000);
    }
  });

  test('normalizeError should return Error objects as-is', () => {
    const error = new Error('Test error');
    const result = normalizeError(error);
    expect(result).toBe(error);
    expect(result).toBeInstanceOf(Error);
  });

  test('normalizeError should convert non-Error values to Error objects', () => {
    const stringError = 'String error message';
    const result = normalizeError(stringError);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('String error message');
  });

  test('normalizeError should handle null and undefined', () => {
    const nullResult = normalizeError(null);
    expect(nullResult).toBeInstanceOf(Error);
    expect(nullResult.message).toBe('null');

    const undefinedResult = normalizeError(undefined);
    expect(undefinedResult).toBeInstanceOf(Error);
    expect(undefinedResult.message).toBe('undefined');
  });

  test('normalizeError should handle objects', () => {
    const objectError = { message: 'Object error', code: 500 };
    const result = normalizeError(objectError);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('[object Object]');
  });
});
