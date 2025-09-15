import { Observable, Subject } from 'rxjs';
import { RxRequest, RxStatefulConfig, RxStatefulSourceTriggerConfig } from './types/types';
import { createRxStateful } from './util/create-rx-stateful';
import { withRefetchOnTrigger } from './refetch-strategies/refetch-on-trigger.strategy';
import { createState$ } from './create-state';
import { assertInInjectionContext, inject, Injector, runInInjectionContext } from '@angular/core';
import { RX_STATEFUL_CONFIG } from './config/rx-stateful-config';

export type RxStatefulLoader<T, A, E> = {
  /**
   * Optional trigger to trigger the requestFn with an argument.
   *
   * If no trigger is provided, the requestFn is called without an argument.
   */
  trigger?: Observable<A> | Subject<A>;
  /**
   * Function to create the request observable.
   * If a trigger is provided, the function is called with the trigger value.
   * If no trigger is provided, the function is called without a value.
   */
  requestFn: (arg: A) => Observable<T>;
  /**
   * Configuration for the stateful request
   */
  config?: RxStatefulConfig<T, E> & {
    /**
     *
     * default: 'switch'
     */
    operator?: 'switch' | 'merge' | 'concat' | 'exhaust';
  };
};

export type RxStatefulLoaderNoTrigger<T, E> = {
  /**
   * Function to create the request observable.
   */
  requestFn: () => Observable<T>;
  /**
   * Configuration for the stateful request
   */
  config?: RxStatefulConfig<T, E>;
};

/**
 * @publicApi
 *
 * @description
 * Function to create a stateful request object without a trigger.
 * The requestFn is called without arguments.
 *
 * @example
 * const rxRequest = rxRequest({
 *  requestFn: () => httpClient.get('https://my-api.com'),
 *  config: {keepValueOnRefresh: true}
 * })
 * @param loaderOptions
 */
export function rxRequest<T, E = unknown>(loaderOptions: RxStatefulLoaderNoTrigger<T, E>): RxRequest<T, E>;

/**
 * @publicApi
 *
 * @description
 * Function to create a stateful request object with a trigger.
 * The requestFn is called with the trigger value.
 *
 * @example
 * const sourceTrigger$$ = new Subject<string>()
 * const rxRequest = rxRequest({
 *  requestFn: (arg: string) => httpClient.get(`https://my-api.com/${arg}`),
 *  trigger: sourceTrigger$$,
 *  config: {keepValueOnRefresh: true}
 * })
 * @param loaderOptions
 */
export function rxRequest<T, A, E = unknown>(loaderOptions: RxStatefulLoader<T, A, E>): RxRequest<T, E>;

export function rxRequest<T, A, E = unknown>(loaderOptions: RxStatefulLoader<T, A, E> | RxStatefulLoaderNoTrigger<T, E>): RxRequest<T, E> {
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
        operator: (config as any)?.operator ?? 'switch',
      };
    }

    const state$ = createState$<T, A, E>(
      trigger ? requestFn : (requestFn as () => Observable<T>)(),
      mergedConfig
    );
    const rxStateful = createRxStateful<T, E>(state$, mergedConfig);

    return {
      value$: () => rxStateful,
      refresh: () => refreshSubject.next(),
    };
  });
}
