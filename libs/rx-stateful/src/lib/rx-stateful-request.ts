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

export type RxStatefulLoader<T,A,E> = {
  trigger?: Observable<A> | Subject<A>;
  requestFn: (arg: A) => Observable<T>;
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
 * @example
 * const sourceTrigger$$ = new Subject<string>()
 * const rxStateful$ = rxStateful$((arg: string) => httpClient.get(`https://my-api.com/${arg}`), { keepValueOnRefresh: true, sourceTriggerConfig: {trigger: sourceTrigger$$}})
 * @param sourceFn$
 * @param sourceTriggerConfig
 */
export function rxStatefulRequest<T,A, E = unknown>(loaderOptions: RxStatefulLoader<T, A, E>): RxStatefulRequest<T, E>{
  const {requestFn, trigger, config} = loaderOptions;

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
