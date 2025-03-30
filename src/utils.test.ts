import { safeTimeout } from './utils';
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
});
