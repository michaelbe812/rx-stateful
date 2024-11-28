import { inject } from '@angular/core';
import { makeFeature } from './config-feature';
import { Config, RX_STATEFUL_CONFIG } from '@angular-kit/rx-stateful';

export function withConfig<T, E>(config: Config<T, E>) {
  return makeFeature('Config', [{ provide: RX_STATEFUL_CONFIG, useValue: config }]);
}

export function injectRxStatefulConfig<T, E>(): Config<T, E> | null {
  return inject(RX_STATEFUL_CONFIG, { optional: true });
}
