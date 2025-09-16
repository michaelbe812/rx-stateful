import { mergeRefetchStrategies } from './merge-refetch-strategies';
import { RefetchStrategy } from './refetch-strategy';
import { withRefetchOnTrigger } from './refetch-on-trigger.strategy';
import { BehaviorSubject, concatAll, mergeAll, of, ReplaySubject, Subject } from 'rxjs';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { vi } from 'vitest';

describe('mergeRefetchStrategies', () => {
  it('should return empty array when no refetchStrategies are provided', () => {
    expect(mergeRefetchStrategies([])).toEqual([]);
  });

  it('should filter out null or undefined strategies', () => {
    expect(
      mergeRefetchStrategies([null as unknown as RefetchStrategy, undefined as unknown as RefetchStrategy])
    ).toEqual([]);
  });

  it('should return for each strategy the refetch$ observable', () => {
    const trigger1$ = new Subject();
    const trigger2$ = new ReplaySubject();
    const trigger3$ = new BehaviorSubject<any>(null);
    const strategies: RefetchStrategy[] = [
      withRefetchOnTrigger(trigger1$),
      withRefetchOnTrigger(trigger2$),
      withRefetchOnTrigger(trigger3$),
    ];

    const refetchStrategies = mergeRefetchStrategies(strategies);
    expect(refetchStrategies.length).toEqual(3);

    const result = subscribeSpyTo(of(refetchStrategies).pipe(concatAll(), mergeAll()));

    trigger1$.next(10);
    trigger2$.next(20);
    trigger3$.next(30);

    expect(result.getValues()).toEqual([10, 20, 30]);
  });

  it('should not double-call refetchFn for each strategy', () => {
    const refetchFnSpy = vi.fn(() => new Subject());
    const mockStrategy: RefetchStrategy = {
      refetchFn: refetchFnSpy,
      kind: 'trigger__rxStateful',
    };

    mergeRefetchStrategies([mockStrategy]);

    // Verify refetchFn is called exactly once per strategy
    expect(refetchFnSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle BehaviorSubject initial values correctly via strategy', () => {
    // BehaviorSubject with initial value
    const behaviorTrigger$ = new BehaviorSubject<number>(100);
    const strategy = withRefetchOnTrigger(behaviorTrigger$);

    const refetchObservables = mergeRefetchStrategies([strategy]);
    expect(refetchObservables.length).toEqual(1);

    const spy = subscribeSpyTo(refetchObservables[0]);

    // Should not emit the initial value (100) because withRefetchOnTrigger applies skip(1)
    expect(spy.getValues()).toEqual([]);

    // Emit a new value
    behaviorTrigger$.next(200);

    // Should only have the new value, not the initial
    expect(spy.getValues()).toEqual([200]);
  });
});
