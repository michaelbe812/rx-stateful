import { SourceTriggerConfig } from './types';

export function isFunctionGuard(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isSourceTriggerConfigGuard<T>(arg: any): arg is SourceTriggerConfig<T> {
  return arg?.sourceTriggerConfig !== undefined;
}
