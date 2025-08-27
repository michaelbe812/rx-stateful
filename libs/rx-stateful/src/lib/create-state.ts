import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  filter,
  isObservable,
  map,
  merge,
  NEVER,
  Observable,
  of,
  race,
  ReplaySubject,
  scan,
  share,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { InternalRxState, RxStatefulConfig, RxStatefulSourceTriggerConfig, RxStatefulWithError } from './types/types';
import { shareWithReplay } from './util/share-operators';
import { _handleSyncValue } from './util/handle-sync-value';
import { defaultAccumulationFn } from './types/accumulation-fn';
import { mergeRefetchStrategies } from './refetch-strategies/merge-refetch-strategies';
import { isFunctionGuard, isSourceTriggerConfigGuard } from './types/guards';
import { applyFlatteningOperator } from './util/apply-flattening-operator';

/**
 * @internal
 * @description
 * helper function to create the rxStateful$ observable
 */
export function createState$<T, A, E>(
  sourceOrSourceFn$: Observable<T> | ((arg: A) => Observable<T>),
  mergedConfig: RxStatefulConfig<T, E> | RxStatefulSourceTriggerConfig<T, A, E>
) {
  const accumulationFn = mergedConfig.accumulationFn ?? defaultAccumulationFn;
  const error$$ = new Subject<RxStatefulWithError<T, E>>();

  const suspenseThreshold: number = mergedConfig.suspenseThresholdMs!;
  const suspenseTime: number = mergedConfig.suspenseTimeMs!;

  // case 1: SourceTriggerConfig given --> sourceOrSourceFn$ is function
  if (isFunctionGuard(sourceOrSourceFn$) && isSourceTriggerConfigGuard(mergedConfig)) {
    /**
     * we need to cache the argument which is passed to sourceOrSourceFn$ because
     * we want to use it when we refresh the value
     */
    let cachedArgument: A | undefined = undefined;
    /**
     * Value when the sourcetrigger emits
     */
    const sourceTrigger$ = (mergedConfig as RxStatefulSourceTriggerConfig<T, A, E>)?.sourceTriggerConfig.trigger;

    const valueFromSourceTrigger$ = sourceTrigger$.pipe(
      tap((arg) => (cachedArgument = arg)),
      applyFlatteningOperator(
        (mergedConfig as RxStatefulSourceTriggerConfig<T, A, E>)?.sourceTriggerConfig?.operator,
        (arg) =>
          sourceOrSourceFn$(arg).pipe(
            map((v) => mapToValue(v)),
            deriveInitialValue<T, E>(mergedConfig)
          )
      ),
      shareWithReplay(),
      catchError((error: E) => handleError<T, E>(error, mergedConfig, error$$))
    );

    const refreshTrigger$ = merge(...mergeRefetchStrategies(mergedConfig?.refetchStrategies));

    /**
     * value when we refresh
     */
    const refreshedValue$ = refreshTrigger$.pipe(
      /**
       * TODO
       * verify if we can safely ignore that cachedArgument is undefined.
       * Theoretically we need to check if s$ has emitted a value before then cachedArgument is defined.
       *
       * TODO --> we definately need to handle it
       */

      switchMap(() =>
        // @ts-ignore
        sourceOrSourceFn$(cachedArgument).pipe(
          map((v) => mapToValue(v)),
          deriveInitialValue<T, E>(mergedConfig),
          catchError((error: E) => handleError<T, E>(error, mergedConfig, error$$))
        )
      ),
      shareWithReplay()
    );

    const hasResponse1$ = refreshedValue$.pipe(
      // @ts-ignore
      map((v) => v.context === 'next' || v.context === 'error'),
      filter((v) => !!v)
    );
    const hasResponse2$ = valueFromSourceTrigger$.pipe(
      // @ts-ignore
      map((v) => v.context === 'next' || v.context === 'error'),
      filter((v) => !!v)
    );

    // refreshedValue$
    const s1 = refreshTrigger$.pipe(
      switchMap(() =>
        merge(
          // ON after suspenseThreshold
          timer(suspenseThreshold).pipe(
            map(() => true),
            // if response comes earlier than thresehold we do not want to emit loading
            takeUntil(hasResponse1$)
          ),
          // OFF once we receive a result, yet at least after suspenseTime + suspenseThreshold
          combineLatest([
            refreshedValue$.pipe(
              // with this we make sure that we do not turn off the suspsense state as long as a request is running
              // @ts-ignore
              filter((v) => v.context !== 'suspense')
            ),
            timer(suspenseThreshold + suspenseTime),
          ]).pipe(map(() => false))
        ).pipe(startWith(false))
      )
    );
    // valueFromSourceTrigger$
    const s2 = sourceTrigger$.pipe(
      switchMap(() =>
        merge(
          // ON after suspenseThreshold
          timer(suspenseThreshold).pipe(
            map(() => true),
            // if response comes earlier than thresehold we do not want to emit loading
            takeUntil(hasResponse2$)
          ),
          // OFF once we receive a result, yet at least after suspenseTime + suspenseThreshold
          combineLatest([
            valueFromSourceTrigger$.pipe(
              // with this we make sure that we do not turn off the suspsense state as long as a request is running
              // @ts-ignore
              filter((v) => v.context !== 'suspense')
            ),
            timer(suspenseThreshold + suspenseTime),
          ]).pipe(map(() => false))
        ).pipe(startWith(false))
      )
    );

    // Correct Pairs
    const pair1$ = s2.pipe(
      withLatestFrom(valueFromSourceTrigger$),
      filter(
        // @ts-ignore
        ([loading, valueFromSourceTrigger]) => (!loading && valueFromSourceTrigger.context !== 'suspense') || loading
      ),
      map(([loading, value]) => value)
    );

    const pair2$ = s1.pipe(
      withLatestFrom(refreshedValue$),
      filter(
        // @ts-ignore
        ([loading, valueFromSourceTrigger]) => (!loading && valueFromSourceTrigger.context !== 'suspense') || loading
      ),
      map(([loading, value]) => value)
    );

    const finalResult$ = merge(
      // @ts-ignore
      race(pair1$, valueFromSourceTrigger$.pipe(filter((v) => v?.context !== 'suspense'))),
      // @ts-ignore
      race(pair2$, refreshedValue$.pipe(filter((v) => v?.context !== 'suspense')))
    );

    const result$ = merge(finalResult$, error$$).pipe(
      /**
       * todo
       * this is a bit hacky as value can not be undefined (it is typed
       * as T | null). However when I change to null some side effets happen.
       * Need investigation!!!
       */
      // @ts-ignore
      scan(accumulationFn, {
        isLoading: false,
        isRefreshing: false,
        value: undefined,
        error: undefined,
        context: 'suspense',
      }),
      distinctUntilChanged(),
      shareWithReplay(),
      _handleSyncValue()
    );

    return result$;
  }

  // case 2: no SourceTriggerConfig given --> sourceOrSourceFn$ is Observable
  if (isObservable(sourceOrSourceFn$)) {
    const sharedSource$ = sourceOrSourceFn$.pipe(
      shareWithReplay(),
      catchError((error: E) => handleError<T, E>(error, mergedConfig, error$$))
    );

    const refresh$ = merge(new BehaviorSubject(null), ...mergeRefetchStrategies(mergedConfig?.refetchStrategies));

    const refreshedRequest$: Observable<Partial<InternalRxState<T, E>>> = refresh$.pipe(
      // @ts-ignore
      switchMap(() =>
        sharedSource$.pipe(
          map((v) => mapToValue(v)),
          deriveInitialValue<T, E>(mergedConfig)
        )
      ),
      shareWithReplay()
    ) as Observable<Partial<InternalRxState<T, E>>>;

    const hasResponse$ = refreshedRequest$.pipe(
      map((v) => v.context === 'next' || v.context === 'error'),
      filter((v) => !!v)
    );
    const showLoadingIndicator$ = refresh$.pipe(
      switchMap(() =>
        merge(
          // ON after suspenseThreshold
          timer(suspenseThreshold).pipe(
            map(() => true),
            // if response comes earlier than thresehold we do not want to emit loading
            takeUntil(hasResponse$)
          ),
          // OFF once we receive a result, yet at least after suspenseTime + suspenseThreshold
          combineLatest([
            refreshedRequest$.pipe(
              // with this we make sure that we do not turn off the suspsense state as long as a request is running
              filter((v) => v.context !== 'suspense')
            ),
            timer(suspenseThreshold + suspenseTime),
          ]).pipe(map(() => false))
        ).pipe(startWith(false))
      )
    );

    const pair$ = showLoadingIndicator$.pipe(
      withLatestFrom(refreshedRequest$),
      filter(
        ([loading, valueFromSourceTrigger]) => (!loading && valueFromSourceTrigger.context !== 'suspense') || loading
      ),
      map(([loading, value]) => value)
    );
    // We need to do this because if the response is coming immediatly/before the threshold is reached we would not get any value
    const result$ = race(pair$, refreshedRequest$.pipe(filter((v) => v.context !== 'suspense')));

    return merge(result$, error$$).pipe(
      /**
       * todo
       * this is a bit hacky as value can not be undefined (it is typed
       * as T | null). However when I change to null some side effets happen.
       * Need investigation!!!
       */
      // @ts-ignore
      scan(accumulationFn, {
        isLoading: false,
        isRefreshing: false,
        value: undefined,
        error: undefined,
        context: 'suspense',
      }),
      distinctUntilChanged(),
      shareWithReplay(),
      _handleSyncValue()
    );
  }

  // todo throw error?
  return of({} as InternalRxState<T>);
}

function deriveInitialValue<T, E>(mergedConfig: RxStatefulConfig<T, E>) {
  // TODO for first emission set isRefreshing to false
  let value: Partial<InternalRxState<T, E>> = {
    isLoading: true,
    isRefreshing: true,
    context: 'suspense',
  };
  if (!mergedConfig.keepValueOnRefresh) {
    value = {
      ...value,
      value: null,
    };
  }
  if (!mergedConfig.keepErrorOnRefresh) {
    value = {
      ...value,
      error: undefined,
    };
  }

  return startWith(value);
}

function handleError<T, E>(
  error: E,
  mergedConfig: RxStatefulConfig<T, E>,
  error$$: Subject<RxStatefulWithError<T, E>>
) {
  mergedConfig?.beforeHandleErrorFn?.(error);
  const errorMappingFn = mergedConfig.errorMappingFn ?? ((error: E) => error as any);
  error$$.next({ error: errorMappingFn(error), context: 'error', isLoading: false, isRefreshing: false, value: null });
  return NEVER;
}

function mapToValue<T, E>(value: T): Partial<InternalRxState<T, E>> {
  return { value, isLoading: false, isRefreshing: false, context: 'next', error: undefined };
}
