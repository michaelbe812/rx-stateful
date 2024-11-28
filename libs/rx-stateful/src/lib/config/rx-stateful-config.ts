import {InjectionToken, makeEnvironmentProviders} from '@angular/core';
import { RxStatefulConfig } from '../types/types';
import { RefetchStrategy } from '../refetch-strategies/refetch-strategy';

export type Config<T, E> = Pick<
  RxStatefulConfig<T, E>,
  'keepErrorOnRefresh' | 'keepValueOnRefresh' | 'errorMappingFn' | 'beforeHandleErrorFn' | 'accumulationFn' | 'suspenseTimeMs' | 'suspenseThresholdMs'
> & {
  autoRefetch?: RefetchStrategy;
};
export const RX_STATEFUL_CONFIG = <T,E>() => new InjectionToken<Config<T, E>>('RX_STATEFUL_CONFIG');

export function provideRxStatefulConfig<T, E>(config: Partial<Config<T, E>>) {
  return makeEnvironmentProviders([{ provide: RX_STATEFUL_CONFIG<T, E>, useValue: config }]);
}


