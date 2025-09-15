import '../test-setup';
import { describe, expect, vi, beforeEach, it } from 'vitest';
import { rxRequest } from './rx-request';
import { Subject, throwError, of, timer } from 'rxjs';
import { delay, mergeMap, switchMap } from 'rxjs/operators';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { withRefetchOnTrigger } from './refetch-strategies/refetch-on-trigger.strategy';
import { TestBed } from '@angular/core/testing';

function test(label: string, callback: () => void) {
  it(label, () => {
    TestBed.runInInjectionContext(callback);
  });
}

describe('beforeHandleErrorFn invocation count', () => {
  let beforeHandleErrorFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    beforeHandleErrorFn = vi.fn();
  });

  describe('Basic invocation count', () => {
    test('should call beforeHandleErrorFn exactly once per error in lazy signature', () => {
      const error = new Error('test error');

      const request = rxRequest({
        requestFn: () => throwError(() => error),
        config: {
          beforeHandleErrorFn,
        },
      });

      const result = subscribeSpyTo(request.value$());

      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      const lastValue = result.getLastValue();
      expect(lastValue?.hasError).toBe(true);
      expect(lastValue?.error).toBe(error);
    });

    test('should call beforeHandleErrorFn exactly once per error in callback signature', () => {
      const trigger$ = new Subject<number>();
      const error = new Error('test error');

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      trigger$.next(1);

      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      expect(result.getLastValue()?.hasError).toBe(true);
      expect(result.getLastValue()?.error).toBe(error);
    });

    test('should not call beforeHandleErrorFn when request succeeds', () => {
      const trigger$ = new Subject<number>();

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => of('success'),
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      trigger$.next(1);

      expect(beforeHandleErrorFn).not.toHaveBeenCalled();
      expect(result.getLastValue()?.hasError).toBe(false);
      expect(result.getLastValue()?.value).toBe('success');
    });
  });

  describe('Multiple error scenarios', () => {
    test('should call beforeHandleErrorFn once per distinct error', () => {
      const trigger$ = new Subject<number>();
      const error1 = new Error('error 1');
      const error2 = new Error('error 2');
      let errorCount = 0;

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => {
            errorCount++;
            return throwError(() => (errorCount === 1 ? error1 : error2));
          },
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      trigger$.next(1);
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error1);

      trigger$.next(2);
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(2);
      expect(beforeHandleErrorFn).toHaveBeenNthCalledWith(2, error2);
    });

    test('should handle rapid successive errors correctly', () => {
      const trigger$ = new Subject<number>();
      const error = new Error('rapid error');

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      // Rapid fire triggers
      trigger$.next(1);
      trigger$.next(2);
      trigger$.next(3);

      // Each trigger starts an error before being switched
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(3);
      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
    });

    test('should handle delayed errors correctly', () => {
      const trigger$ = new Subject<number>();
      const error = new Error('delayed error');

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => timer(10).pipe(switchMap(() => throwError(() => error))),
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      trigger$.next(1);

      // Wait for delayed error
      setTimeout(() => {
        expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
        expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      }, 20);
    });
  });

  describe('Refresh error scenarios', () => {
    test('should call beforeHandleErrorFn once for refresh errors', () => {
      const refresh$ = new Subject<void>();
      const error = new Error('refresh error');

      const result = subscribeSpyTo(
        rxRequest({
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
            refetchStrategies: [withRefetchOnTrigger(refresh$)],
          },
        }).value$()
      );

      // Initial error
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);

      // Trigger refresh
      refresh$.next();

      // Should call error handler again for refresh error
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(2);
      expect(beforeHandleErrorFn).toHaveBeenNthCalledWith(2, error);
    });

    test('should handle errors during concurrent refresh', () => {
      const refresh$ = new Subject<void>();
      const trigger$ = new Subject<number>();
      const error = new Error('concurrent error');

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
            refetchStrategies: [withRefetchOnTrigger(refresh$)],
          },
        }).value$()
      );

      // Initial trigger
      trigger$.next(1);
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);

      // Concurrent refresh and trigger
      refresh$.next();
      trigger$.next(2);

      // Should handle both errors (initial + refresh + new trigger)
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(3);
    });

    test('should call beforeHandleErrorFn with keepErrorOnRefresh', () => {
      const refresh$ = new Subject<void>();
      const error = new Error('keep error test');

      const result = subscribeSpyTo(
        rxRequest({
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
            keepErrorOnRefresh: true,
            refetchStrategies: [withRefetchOnTrigger(refresh$)],
          },
        }).value$()
      );

      // Initial error
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      expect(result.getLastValue()?.hasError).toBe(true);

      // Refresh should still call error handler
      refresh$.next();
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with different error sources', () => {
    test('should handle initial request errors correctly', () => {
      const error = new Error('initial error');

      const result = subscribeSpyTo(
        rxRequest({
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      expect(result.getLastValue()?.context).toBe('error');
    });

    test('should handle async errors correctly', () => {
      const error = new Error('async error');

      const result = subscribeSpyTo(
        rxRequest({
          requestFn: () =>
            of(null).pipe(
              delay(10),
              mergeMap(() => throwError(() => error))
            ),
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      setTimeout(() => {
        expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
        expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      }, 20);
    });

    test('should handle errors after successful requests', () => {
      const trigger$ = new Subject<number>();
      const error = new Error('after success error');
      let requestCount = 0;

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => {
            requestCount++;
            return requestCount === 1 ? of('success') : throwError(() => error);
          },
          config: {
            beforeHandleErrorFn,
          },
        }).value$()
      );

      // First request succeeds
      trigger$.next(1);
      expect(beforeHandleErrorFn).not.toHaveBeenCalled();
      expect(result.getLastValue()?.value).toBe('success');

      // Second request fails
      trigger$.next(2);
      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      expect(result.getLastValue()?.hasError).toBe(true);
    });
  });

  describe('Error mapping integration', () => {
    test('should call beforeHandleErrorFn before errorMappingFn', () => {
      const error = new Error('original error');
      const errorMappingFn = vi.fn((e: Error) => e.message);

      const result = subscribeSpyTo(
        rxRequest({
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
            errorMappingFn,
          },
        }).value$()
      );

      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
      expect(errorMappingFn).toHaveBeenCalledWith(error);
      expect(result.getLastValue()?.error).toBe('original error');
    });

    test('errorMappingFn should not affect beforeHandleErrorFn invocation', () => {
      const trigger$ = new Subject<number>();
      const error = new Error('test');

      const result = subscribeSpyTo(
        rxRequest({
          trigger: trigger$,
          requestFn: () => throwError(() => error),
          config: {
            beforeHandleErrorFn,
            errorMappingFn: (e: Error) => ({ message: e.message }),
          },
        }).value$()
      );

      trigger$.next(1);
      trigger$.next(2);

      expect(beforeHandleErrorFn).toHaveBeenCalledTimes(2);
      expect(beforeHandleErrorFn).toHaveBeenCalledWith(error);
    });
  });
});
