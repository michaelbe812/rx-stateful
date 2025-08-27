import {
  Observable,
  Subject,
} from 'rxjs';
import {
  RxStatefulConfig,
  RxRequest,
  RxStatefulSourceTriggerConfig,
} from './types/types';
import {_handleSyncValue} from './util/handle-sync-value';
import {createRxStateful} from './util/create-rx-stateful';
import { withRefetchOnTrigger } from './refetch-strategies/refetch-on-trigger.strategy';
import { createState$ } from './rx-stateful$';
import { assertInInjectionContext, inject, Injector, runInInjectionContext } from '@angular/core';
import { RX_STATEFUL_CONFIG } from './config/rx-stateful-config';

export type RxStatefulLoader<T,A,E> = {
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
}




/**
 * @publicApi
 *
 * @description
 * Function to create a stateful request object which can be used to trigger a request and handle the state of the request.
 * The requestFn is called with the trigger value if a trigger is provided.
 * The requestFn is called without a value if no trigger is provided.
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
export function rxRequest<T,A, E = unknown>(loaderOptions: RxStatefulLoader<T, A, E>): RxRequest<T, E>{
  const {requestFn, trigger, config} = loaderOptions;

  !config?.injector && assertInInjectionContext(rxRequest);
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
    /**
     * requestFn & !trigger -> source$
     * requestFn & trigger -> sourceFn$ with trigger
     */
    if (trigger){
      // @ts-ignore
      mergedConfig.sourceTriggerConfig = {
        trigger,
        operator: config?.operator ?? 'switch'
      }
    }

   const state$ = createState$<T,A, E>(trigger ? requestFn : requestFn(undefined as A), mergedConfig);
   const rxStateful = createRxStateful<T, E>(state$, mergedConfig);

   return {
       value$: () => rxStateful,
       refresh: () => refreshSubject.next()
   };
  })
}
