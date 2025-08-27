import {inject, Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {
  RxStateful,
  RxStatefulConfig,
  rxRequest,
  Config,
  RX_STATEFUL_CONFIG
} from '@angular-kit/rx-stateful';
import {RX_STATEFUL_CLIENT_CONFIG} from "../config/with-config";


export type RxStatefulRequestOptions<T, E> = RxStatefulConfig<T, E>;

@Injectable({
  providedIn: 'root',
})
export class RxStatefulClient {
  private readonly config = inject(RX_STATEFUL_CLIENT_CONFIG, {optional: true});

  request<T, E>(source$: Observable<T>): Observable<RxStateful<T, E>>
  request<T, E, K extends keyof RxStateful<T,E>>(source$: Observable<T>, key: K): Observable<RxStateful<T, E>[K]>;

  request<T, E>(source$: Observable<T>, options: RxStatefulRequestOptions<T, E>): Observable<RxStateful<T, E>>;
  request<T, E, K extends keyof RxStateful<T, E>>(source$: Observable<T>, options: RxStatefulRequestOptions<T, E>, key: K): Observable<RxStateful<T, E>[K]>;

  request<T, E, K extends keyof RxStateful<T, E>>(source$: Observable<T>, optionsOrKey?: RxStatefulRequestOptions<T, E> | K, key?: K):Observable<RxStateful<T, E>> | Observable<RxStateful<T, E>[K]> {

    const strategies = [];
    if (typeof optionsOrKey === 'object') {

      if (optionsOrKey?.refetchStrategies) {
        if (Array.isArray(optionsOrKey.refetchStrategies)) {
          strategies.push(...optionsOrKey.refetchStrategies)
        }
        if (!Array.isArray(optionsOrKey.refetchStrategies)) {
          strategies.push(optionsOrKey.refetchStrategies)
        }
      }
    }

    const refetchstrategies = [
        (this.config?.autoRefetch ?? void 0),
        ...strategies
    ]
    const options = typeof optionsOrKey === 'object' ? optionsOrKey : {};
    const mergedConfig: RxStatefulConfig<T,  E> = {
      ...(this.config as Config<T, E>),
       ...options,
      // @ts-ignore
      refetchStrategies: [...refetchstrategies].filter(Boolean)
    };

    const k = typeof optionsOrKey === 'string' ? optionsOrKey : key;

    const request = rxRequest<T, undefined, E>({
      requestFn: () => source$,
      config: mergedConfig
    });

    if (k){
      return request.value$().pipe(
        map(state => state[k])
      );
    }
    return request.value$();
  }
}
