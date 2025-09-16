import { RefetchStrategy } from './refetch-strategy';
import { Observable } from 'rxjs';

export function mergeRefetchStrategies(
  refetchStrategies: RefetchStrategy[] | RefetchStrategy | undefined
): Observable<any>[] {
  if (!refetchStrategies) {
    return [];
  }
  const strategies: RefetchStrategy[] = Array.isArray(refetchStrategies) ? refetchStrategies : [refetchStrategies];
  return strategies.filter(Boolean).map((strategy) => strategy.refetchFn());
}
