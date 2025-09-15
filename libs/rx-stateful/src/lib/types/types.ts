import {Observable, Subject} from 'rxjs';
import {RxStatefulAccumulationFn} from "./accumulation-fn";
import {RefetchStrategy} from "../refetch-strategies/refetch-strategy";
import {Injector} from "@angular/core";



/**
 * @publicApi
 *
 * @description
 * Context of the current emission.
 */
export type RxStatefulContext =  'suspense' | 'error' | 'next';



/**
 * @publicApi
 */
export interface RxStateful<T, E = unknown> {
  hasError: boolean;
  error: E | undefined;

  isSuspense: boolean;

  context: RxStatefulContext;

  value: T | null;
  hasValue: boolean;
}


export type RxStatefulWithError<T, E = unknown> = Pick<InternalRxState<T, E>,  'error' | 'context' | 'isLoading' | 'isRefreshing' | 'value' >;

/**
 * @internal
 */
export interface InternalRxState<T, E = unknown> {
  value: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: E | undefined;
  context: RxStatefulContext;
}

/**
 * @publicApi
 *
 * @description
 * Configuration for rxStateful$
 *
 * @example
 * rxStateful$(source$, {keepValueOnRefresh: true})
 */
export interface RxStatefulConfig<T, E = unknown> {
  /**
   * One or multiple Trigger to refresh the source$.
   */
  refetchStrategies?: RefetchStrategy[] | RefetchStrategy
  /**
   * Define if the value should be kept on refresh or reset to null
   * @default false
   */
  keepValueOnRefresh?: boolean;
  /**
   * Accumulation function to accumulate the state.
   *
   * @default: ({ ...acc, ...val })
   */
  accumulationFn?: RxStatefulAccumulationFn<T, E>;
  /**
   * Define if the error should be kept on refresh or reset to null
   * @default false
   */
  keepErrorOnRefresh?: boolean;
  /**
   * Mapping function to map the error to a specific value.
   * @param error - the error which is thrown by the source$, e.g. a {@link HttpErrorResponse}.
   */
  errorMappingFn?: (error: unknown) => E;
  /**
   * Function which is called before the error is handled.
   * @param error - the error which is thrown by the source$, e.g. a {@link HttpErrorResponse}.
   */
  beforeHandleErrorFn?: (error: E) => void;
  /**
   * Time in ms after which the suspense state is emitted.
   * For faster suspense times as the threshold no suspense state is emitted
   */
  suspenseThresholdMs?: number;
  /**
   * Time in ms for which time interval the suspense state is valid before
   * the next value is emitted.
   */
  suspenseTimeMs?: number;

  injector?: Injector;
}

export interface SourceTriggerConfig<A> {
  trigger: Observable<A> | Subject<A>;
  /**
   *
   * default: 'switch'
   */
  operator?: 'switch' | 'merge' | 'concat' | 'exhaust';
}

export type RxStatefulSourceTriggerConfig<T,A, E = unknown> = RxStatefulConfig<T, E> &{
  /**
   *
   */
  sourceTriggerConfig: SourceTriggerConfig<A>
}

/**
 * @publicApi
 *
 * @description
 * Interface for the stateful request object returned by rxStateful$
 */
export interface RxRequest<T, E = unknown> {
  /**
   * Observable that emits the current state including value, error, and loading states
   */
  value$: () => Observable<RxStateful<T, E>>;

  /**
   * Function to manually trigger a refresh of the source observable
   */
  refresh: () => void;
}
