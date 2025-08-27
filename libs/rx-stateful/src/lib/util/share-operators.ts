import { ReplaySubject, share } from 'rxjs';

/**
 * Creates a share operator with ReplaySubject(1) that resets on error, complete, and zero refcount.
 * This is the standard sharing configuration used throughout the rx-stateful library.
 */
export function shareWithReplay<T>() {
  return share<T>({
    connector: () => new ReplaySubject(1),
    resetOnError: true,
    resetOnComplete: true,
    resetOnRefCountZero: true,
  });
}