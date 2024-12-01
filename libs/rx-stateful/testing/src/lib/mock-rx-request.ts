import { RxStateful, RxRequest } from '@angular-kit/rx-stateful';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";

export interface RxRequestMock<T, E = unknown> {
  instance: RxRequest<T, E>;
  state$Trigger: Subject<Partial<RxStateful<T, E>>>;
  refreshTrigger: Subject<void>;
}

export function mockRxRequest<T, E = unknown>(): RxRequestMock<T, E> {
  function createTrigger<T>(startValue?: T | null | undefined) {
    const trigger = startValue ? new BehaviorSubject(startValue) : new ReplaySubject<T>(1);
    return trigger;
  }

  const state$Trigger = createTrigger<Partial<RxStateful<T, E>>>();
  const refreshTrigger = new Subject<void>();

  const instance: RxRequest<T, E> = {
    value$: () => state$Trigger.asObservable() as Observable<RxStateful<T, E>>,
    refresh: () => refreshTrigger.next()
  };

  return {
    instance,
    state$Trigger,
    refreshTrigger
  };
}
