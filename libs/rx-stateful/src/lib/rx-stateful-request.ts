import {
  Observable,
  Subject,
} from 'rxjs';
import {
  RxStatefulConfig,
  RxStatefulRequest,
  RxStatefulSourceTriggerConfig,
} from './types/types';
import {_handleSyncValue} from './util/handle-sync-value';
import {createRxStateful} from './util/create-rx-stateful';
import { withRefetchOnTrigger } from './refetch-strategies/refetch-on-trigger.strategy';
import { createState$ } from './rx-stateful$';
import { assertInInjectionContext, inject, Injector, runInInjectionContext } from '@angular/core';
import { RX_STATEFUL_CONFIG } from './config/rx-stateful-config';



/**
 * @publicApi
 *
 * @description
 * Creates a new rxStateful$ instance.
 *
 * rxStateful$ will enhance the source$ with additional information about the current state of the source$, like
 * e.g. if it is in a suspense or error state.
 *
 * @example
 * const source$ = httpClient.get('https://my-api.com');
 * const rxStateful$ = rxStateful$(source$);
 *
 * @param source$ - The source$ to enhance with additional state information.
 */
export function rxStatefulRequest<T, E = unknown>(source$: Observable<T>): RxStatefulRequest<T, E>;
/**
 * @publicApi
 *
 * @example
 * const source$ = httpClient.get('https://my-api.com');
 * const rxStateful$ = rxStateful$(source$, { keepValueOnRefresh: true });
 *
 * @param source$ - The source$ to enhance with additional state information.
 * @param config - Configuration for rxStateful$.
 */
export function rxStatefulRequest<T, E = unknown>(source$: Observable<T>, config: RxStatefulConfig<T, E>): RxStatefulRequest<T, E>;
/**
 * @publicApi
 *
 * @example
 * const sourceTrigger$$ = new Subject<string>()
 * const rxStateful$ = rxStateful$((arg: string) => httpClient.get(`https://my-api.com/${arg}`), { keepValueOnRefresh: true, sourceTriggerConfig: {trigger: sourceTrigger$$}})
 * @param sourceFn$
 * @param sourceTriggerConfig
 */
export function rxStatefulRequest<T,A, E = unknown>(sourceFn$: (arg: A) => Observable<T>, sourceTriggerConfig: RxStatefulSourceTriggerConfig<T,A, E>): RxStatefulRequest<T, E>;
export function rxStatefulRequest<T,A, E = unknown>(
    sourceOrSourceFn$: Observable<T> | ((arg: A) => Observable<T>),
    config?: RxStatefulConfig<T, E> | RxStatefulSourceTriggerConfig<T,A,E>,
): RxStatefulRequest<T, E> {
  !config?.injector && assertInInjectionContext(rxStatefulRequest);
  const assertedInjector = config?.injector ?? inject(Injector);

  return runInInjectionContext(assertedInjector, () => {
    const globalConfig = inject(RX_STATEFUL_CONFIG, {optional: true});
   // Create internal refresh subject
   const refreshSubject = new Subject<void>();

   /**
    * Merge default config with user provided config
    */
   const mergedConfig: RxStatefulConfig<T, E> = {
       keepValueOnRefresh: false,
       keepErrorOnRefresh: false,
       suspenseThresholdMs: 0,
       suspenseTimeMs: 0,
       ...globalConfig,
       ...config,
       refetchStrategies: [
         withRefetchOnTrigger(refreshSubject),
         ...(Array.isArray(config?.refetchStrategies) ? config.refetchStrategies : config?.refetchStrategies ? [config.refetchStrategies] : [])
       ]
   };

   const state$ = createState$<T,A, E>(sourceOrSourceFn$, mergedConfig);
   const rxStateful = createRxStateful<T, E>(state$, mergedConfig);

   return {
       value$: () => rxStateful,
       refresh: () => refreshSubject.next()
   };
  })
}
