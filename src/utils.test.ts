import { safeTimeout, normalizeError } from './utils';
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
