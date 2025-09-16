import { Observable, Subject } from 'rxjs';
import { RxRequest, RxStatefulConfig, RxStatefulSourceTriggerConfig } from './types/types';
import { createRxStateful } from './util/create-rx-stateful';
import { withRefetchOnTrigger } from './refetch-strategies/refetch-on-trigger.strategy';
import { createState$ } from './create-state';
import { assertInInjectionContext, inject, Injector, runInInjectionContext } from '@angular/core';
import { RX_STATEFUL_CONFIG } from './config/rx-stateful-config';

// Type for no-trigger case
export type RxStatefulLoaderWithoutTrigger<T, E> = {
  /**
   * Function to create the request observable.
   * Called without arguments when no trigger is provided.
   */
  requestFn: () => Observable<T>;
  /**
   * Configuration for the stateful request
   */
  config?: RxStatefulConfig<T, E> & {
    /**
     * default: 'switch'
     */
    operator?: 'switch' | 'merge' | 'concat' | 'exhaust';
  };
};

// Type for with-trigger case
export type RxStatefulLoaderWithTrigger<T, A, E> = {
  /**
   * Trigger to trigger the requestFn with an argument.
   */
  trigger: Observable<A> | Subject<A>;
  /**
   * Function to create the request observable.
   * Called with the trigger value.
   */
  requestFn: (arg: A) => Observable<T>;
  /**
   * Configuration for the stateful request
   */
  config?: RxStatefulConfig<T, E> & {
    /**
     * default: 'switch'
     */
    operator?: 'switch' | 'merge' | 'concat' | 'exhaust';
  };
};

// Union type for backward compatibility
export type RxStatefulLoader<T, A, E> = RxStatefulLoaderWithTrigger<T, A, E> | RxStatefulLoaderWithoutTrigger<T, E>;

/**
 * @publicApi
 *
 * @description
 * Function to create a stateful request object which can be used to trigger a request and handle the state of the request.
 *
 * @overload
 * When no trigger is provided, the requestFn is called without arguments
 *
 * @overload
 * When a trigger is provided, the requestFn is called with the trigger value
 *
 * @example
 * // Without trigger
 * const request = rxRequest({
 *  requestFn: () => httpClient.get('https://my-api.com/data'),
 *  config: {keepValueOnRefresh: true}
 * })
 *
 * @example
 * // With trigger
 * const sourceTrigger$$ = new Subject<string>()
 * const request = rxRequest({
 *  requestFn: (arg: string) => httpClient.get(`https://my-api.com/${arg}`),
 *  trigger: sourceTrigger$$,
 *  config: {keepValueOnRefresh: true}
 * })
 */
// Overload for no-trigger case
export function rxRequest<T, E = unknown>(loaderOptions: RxStatefulLoaderWithoutTrigger<T, E>): RxRequest<T, E>;
// Overload for with-trigger case
export function rxRequest<T, A, E = unknown>(loaderOptions: RxStatefulLoaderWithTrigger<T, A, E>): RxRequest<T, E>;
// Implementation signature
export function rxRequest<T, A, E = unknown>(loaderOptions: RxStatefulLoader<T, A, E>): RxRequest<T, E> {
  const { requestFn, config } = loaderOptions;
  const trigger = 'trigger' in loaderOptions ? loaderOptions.trigger : undefined;

  !config?.injector && assertInInjectionContext(rxRequest);
  const assertedInjector = config?.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const globalConfig = inject(RX_STATEFUL_CONFIG, { optional: true });
    // Create internal refresh subject
    const refreshSubject = new Subject<void>();

    /**
     * Merge default config with user provided config
     */
    const mergedConfig: RxStatefulConfig<T, E> | RxStatefulSourceTriggerConfig<T, A, E> = {
      keepValueOnRefresh: false,
      keepErrorOnRefresh: false,
      suspenseThresholdMs: 0,
      suspenseTimeMs: 0,
      ...globalConfig,
      ...config,
      refetchStrategies: [
        withRefetchOnTrigger(refreshSubject),
        ...(Array.isArray(config?.refetchStrategies)
          ? config.refetchStrategies
          : config?.refetchStrategies
          ? [config.refetchStrategies]
          : []),
      ],
    };
    /**
     * requestFn & !trigger -> source$
     * requestFn & trigger -> sourceFn$ with trigger
     */
    if (trigger) {
      (mergedConfig as RxStatefulSourceTriggerConfig<T, A, E>).sourceTriggerConfig = {
        trigger,
        operator: config?.operator ?? 'switch',
      };
    }

    // Type-safe handling of both overload cases
    const state$ = trigger
      ? createState$<T, A, E>(requestFn as (arg: A) => Observable<T>, mergedConfig)
      : createState$<T, A, E>((requestFn as () => Observable<T>)(), mergedConfig);
    const rxStateful = createRxStateful<T, E>(state$, mergedConfig);

    return {
      value$: () => rxStateful,
      refresh: () => refreshSubject.next(),
    };
  });
}
