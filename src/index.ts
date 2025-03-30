import { createSafeUtils } from './safe';
import { SafeReturn } from './types';
export type { SafeReturn, SafeAsyncReturn, SafeUtilOptions } from './types';

const defaultUtils = createSafeUtils();
export const safe = defaultUtils.safe;
export const safeAsync = defaultUtils.safeAsync;
export const safeAll = defaultUtils.safeAll;
export const safeObservable = defaultUtils.safeObservable;
export const safeObservableAll = defaultUtils.safeObservableAll;
export const safeWithRetries = defaultUtils.safeWithRetries;

// Type guards for SafeReturn
export const isSuccess = <T>(result: SafeReturn<T>): result is [null, T] => result[0] === null;
export const isFailure = <T>(result: SafeReturn<T>): result is [Error, undefined] => result[0] !== null;

export { createSafeUtils };
