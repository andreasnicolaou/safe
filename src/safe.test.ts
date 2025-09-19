/* eslint-disable @typescript-eslint/no-empty-function */
jest.spyOn(console, 'error').mockImplementation(() => {});
import {
  safe,
  safeAsync,
  safeAll,
  safeObservable,
  createSafeUtils,
  isSuccess,
  isFailure,
  SafeReturn,
  safeWithRetries,
} from './index';
import { lastValueFrom } from 'rxjs';

describe('safe utilities', () => {
  describe('all instances', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    test('safe handles sync success', () => {
      const [err, result] = safe(() => 42);
      expect(err).toBeNull();
      expect(isFailure([err, result])).toBe(false);
      expect(result).toBe(42);
    });

    test('safe handles sync errors', () => {
      const [err, result] = safe(() => {
        throw new Error('Something went wrong after all');
      });
      expect(err).toBeInstanceOf(Error);
      expect(result).toBeUndefined();
    });

    test('safeAsync handles async success', async () => {
      const [err, result] = await safeAsync(async () => 42);
      expect(err).toBeNull();
      expect(isFailure([err, result])).toBe(false);
      expect(isSuccess([err, result])).toBe(true);
      expect(result).toBe(42);
    });

    test('safeAsync handles async errors', async () => {
      const [err, result] = await safeAsync(async () => {
        throw new Error('Something went wrong after all async');
      });
      expect(err).toBeInstanceOf(Error);
      expect(result).toBeUndefined();
    });

    test('safeAll handles multiple promises', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.reject(new Error('An error occured on multiple promises')),
        Promise.resolve(3),
      ];
      const results = await safeAll(promises);
      expect(results[0]).toEqual([null, 1]);
      expect(results[1][0]).toBeInstanceOf(Error);
      expect(results[1][1]).toBeUndefined();
      expect(results[2]).toEqual([null, 3]);
    });

    test('safeObservable handles sync values', async () => {
      const obs$ = safeObservable(() => 42);
      const result = await lastValueFrom(obs$);
      expect(result).toBe(42);
    });

    test('safeObservable handles async values', async () => {
      const obs$ = safeObservable(async () => 42);
      const result = await lastValueFrom(obs$);
      expect(result).toBe(42);
    });

    test('safeObservable handles errors', async () => {
      const obs$ = safeObservable(() => {
        throw new Error('Something went wrong after all observable');
      });
      await expect(lastValueFrom(obs$)).rejects.toThrow('Something went wrong after all observable');
    });

    test('safeObservable handles async errors with logging', async () => {
      const obs$ = safeObservable(async () => {
        throw new Error('Async error in observable');
      });
      await expect(lastValueFrom(obs$)).rejects.toThrow('Async error in observable');
    });
  });

  describe('custom instances', () => {
    const mockLogger = jest.fn();
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogger.mockClear();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    test('respects enableLogErrors: false', () => {
      const { safe } = createSafeUtils({ enableLogErrors: false, logger: mockLogger });
      safe(() => {
        throw new Error('An error occurred');
      });
      expect(mockLogger).not.toHaveBeenCalled();
    });

    test('uses custom logger', () => {
      const { safe } = createSafeUtils({ logger: mockLogger });
      safe(() => {
        throw new Error('An error occurred after all');
      });
      expect(mockLogger).toHaveBeenCalledWith(new Error('An error occurred after all'));
    });

    test('safeObservableAll handles multiple promises', async () => {
      const { safeObservableAll } = createSafeUtils();
      const promises = [Promise.resolve(1), Promise.reject(new Error('Something went wrong')), Promise.resolve(3)];
      const results = await lastValueFrom(safeObservableAll(promises));
      expect(results[0]).toEqual([null, 1]);
      expect(results[1][0]).toBeInstanceOf(Error);
      expect(results[1][1]).toBeUndefined();
      expect(results[2]).toEqual([null, 3]);
    });
  });

  describe('type guards', () => {
    test('isSuccess should narrow types correctly', () => {
      const success: SafeReturn<number> = [null, 42];
      if (isSuccess(success)) {
        expect(success[1]).toBe(42);
      }
    });

    test('isFailure should narrow types correctly', () => {
      const failure: SafeReturn<number> = [new Error('Something went wrong'), undefined];
      if (isFailure(failure)) {
        expect(failure[0].message).toBe('Something went wrong');
      }
    });
  });

  describe('retry behavior', () => {
    jest.useFakeTimers();
    test('should succeed on first attempt', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const result = await safeWithRetries(successFn, { retries: 3 });
      expect(isSuccess(result)).toBe(true);
      expect(result[1]).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    test('should apply jitter to delays', async () => {
      jest.useFakeTimers();

      const failingFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Something went wrong 1'))
        .mockResolvedValue('success');

      const promise = safeWithRetries(failingFn, {
        retries: 1,
        initialDelayMs: 100,
        jitter: true,
      });

      expect(failingFn).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(100);
      expect(failingFn).toHaveBeenCalledTimes(2);
      const result = await promise;
      expect(isSuccess(result)).toBe(true);
    });

    test('should retry with exponential backoff', async () => {
      jest.useFakeTimers();
      const failingFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Something went wrong 1'))
        .mockRejectedValueOnce(new Error('Something went wrong 2'))
        .mockResolvedValue('success');

      const promise = safeWithRetries(failingFn, {
        retries: 2,
        initialDelayMs: 100,
      });

      expect(failingFn).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(100);
      expect(failingFn).toHaveBeenCalledTimes(2);
      jest.runAllTimers();
      const result = await promise;
      expect(isSuccess(result)).toBe(true);
      jest.useRealTimers();
    });

    test('should fail after all retries are exhausted', async () => {
      jest.useFakeTimers();
      const failingFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const promise = safeWithRetries(failingFn, {
        retries: 2,
        initialDelayMs: 100,
      });

      // Advance timers step by step to handle all retries
      await jest.advanceTimersByTimeAsync(100); // First retry delay
      await jest.advanceTimersByTimeAsync(200); // Second retry delay

      const result = await promise;
      expect(isFailure(result)).toBe(true);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0]?.message).toBe('Persistent error');
      expect(failingFn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
      jest.useRealTimers();
    });
    jest.useRealTimers();
  });
});
