import {distinctUntilChanged, filter, map, Observable} from 'rxjs';
import {InternalRxState, RxStateful, RxStatefulConfig} from '../types/types';

export function defaultComparisonFn<T, E>(a: RxStateful<T, E>, b: RxStateful<T, E>) {
  return a.value === b.value && a.context === b.context && a.error === b.error
}

/**
 * @internal
 */
export function createRxStateful<T, E>(state$: Observable<InternalRxState<T, E>>, config: RxStatefulConfig<T, E>): Observable<RxStateful<T, E> >{
    return state$.pipe(
        map((state, index) => {
            const value: RxStateful<T, E> = {
                      value: state.value,
                      hasValue: state.value !== null && state.value !== undefined,
                      hasError: !!state.error,
                      error: state.error,
                      isSuspense: state.isLoading || state.isRefreshing,
                      context: state.context,
            }
            // Clear value logic: only clear value if explicitly configured and we're in a loading/refreshing state
            const shouldClearValue = !config.keepValueOnRefresh && (state.isLoading || state.isRefreshing) && index !== 0;

            if (shouldClearValue) {
                return {
                    ...value,
                    value: null
                } as RxStateful<T, E>;
            }

            return value;
        }),
        filter((value) => value !== undefined),
        distinctUntilChanged(defaultComparisonFn)
    )
}
