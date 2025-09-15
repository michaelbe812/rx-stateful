import { distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { InternalRxState, RxStateful, RxStatefulConfig } from '../types/types';

export function defaultComparisonFn<T, E>(a: RxStateful<T, E>, b: RxStateful<T, E>) {
  return a.value === b.value && a.context === b.context && a.error === b.error;
}

/**
 * @internal
 */
export function createRxStateful<T, E>(
  state$: Observable<InternalRxState<T, E>>,
  config: RxStatefulConfig<T, E>
): Observable<RxStateful<T, E>> {
  return state$.pipe(
    map((state, index) => {
      const value: RxStateful<T, E> = {
        value: state.value,
        hasValue: state.value !== null && state.value !== undefined,
        hasError: !!state.error,
        error: state.error,
        isSuspense: state.isLoading || state.isRefreshing,
        context: state.context,
      };
      /**
       * todo there is for sure a nicer way to do this.
       *
       * IF we don't do this we will have two emissions when we refresh and keepValueOnRefresh = true.
       */
      if (index !== 0 && !config.keepValueOnRefresh && (state.isLoading || state.isRefreshing)) {
        return {
          ...value,
          value: null,
        } as RxStateful<T, E>;
      }
      if (!state.isLoading || !state.isRefreshing) {
        return {
          ...value,
          value: state.value,
        } as RxStateful<T, E>;
      }
      return value;
    }),
    filter((value) => value !== undefined),
    distinctUntilChanged(defaultComparisonFn)
  );
}
