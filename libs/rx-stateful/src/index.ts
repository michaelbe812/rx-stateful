export * from './lib/rx-stateful$';
export {rxRequest} from './lib/rx-request'
export {
  RxStatefulContext,
  RxStateful,
  RxStatefulWithError,
  RxStatefulConfig,
  RxStatefulRequest
} from './lib/types/types';
export { RxStatefulAccumulationFn } from './lib/types/accumulation-fn';

export {RefetchStrategy} from './lib/refetch-strategies/refetch-strategy';
export {withAutoRefetch} from './lib/refetch-strategies/refetch-on-auto.strategy';
export {withRefetchOnTrigger} from './lib/refetch-strategies/refetch-on-trigger.strategy';
export {Config, RX_STATEFUL_CONFIG, provideRxStatefulConfig} from './lib/config/rx-stateful-config';
