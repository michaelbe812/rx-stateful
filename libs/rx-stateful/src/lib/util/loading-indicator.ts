import { combineLatest, filter, map, merge, Observable, startWith, switchMap, takeUntil, timer, withLatestFrom } from 'rxjs';
import { InternalRxState } from '../types/types';

/**
 * Creates a loading indicator stream that:
 * - Shows loading after suspenseThreshold milliseconds
 * - Hides loading when response arrives (but at least after suspenseTime + suspenseThreshold)
 * - Doesn't show loading if response comes before threshold
 */
export function createLoadingIndicator<T, E>(
  trigger$: Observable<any>,
  response$: Observable<Partial<InternalRxState<T, E>>>,
  suspenseThreshold: number,
  suspenseTime: number
): Observable<boolean> {
  const hasResponse$ = response$.pipe(
    map((v) => v.context === 'next' || v.context === 'error'),
    filter((v) => !!v)
  );

  return trigger$.pipe(
    switchMap(() =>
      merge(
        // ON after suspenseThreshold
        timer(suspenseThreshold).pipe(
          map(() => true),
          // if response comes earlier than threshold we do not want to emit loading
          takeUntil(hasResponse$)
        ),
        // OFF once we receive a result, yet at least after suspenseTime + suspenseThreshold
        combineLatest([
          response$.pipe(
            // with this we make sure that we do not turn off the suspense state as long as a request is running
            filter((v) => v.context !== 'suspense')
          ),
          timer(suspenseThreshold + suspenseTime),
        ]).pipe(map(() => false))
      ).pipe(startWith(false))
    )
  );
}

/**
 * Pairs loading indicator with response values, filtering out invalid combinations
 */
export function pairLoadingWithResponse<T, E>(
  loadingIndicator$: Observable<boolean>,
  response$: Observable<Partial<InternalRxState<T, E>>>
): Observable<Partial<InternalRxState<T, E>>> {
  return loadingIndicator$.pipe(
    withLatestFrom(response$),
    filter(
      ([loading, value]) => (!loading && value.context !== 'suspense') || loading
    ),
    map(([loading, value]) => value)
  );
}