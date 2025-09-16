import { describe, expect, it } from 'vitest';
import { BehaviorSubject, Subject } from 'rxjs';
import { isFunctionGuard, isSourceTriggerConfigGuard } from './guards';

describe('Type Guards', () => {
  describe('isFunctionGuard', () => {
    it('should return true for functions', () => {
      expect(isFunctionGuard(() => {})).toBe(true);
      expect(isFunctionGuard(function () {})).toBe(true);
      expect(isFunctionGuard(async () => {})).toBe(true);
      expect(isFunctionGuard(function* () {})).toBe(true);
    });

    it('should return true for arrow functions', () => {
      const arrowFn = (x: number) => x * 2;
      expect(isFunctionGuard(arrowFn)).toBe(true);
    });

    it('should return true for class constructors', () => {
      class TestClass {}
      expect(isFunctionGuard(TestClass)).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunctionGuard(null)).toBe(false);
      expect(isFunctionGuard(undefined)).toBe(false);
      expect(isFunctionGuard({})).toBe(false);
      expect(isFunctionGuard([])).toBe(false);
      expect(isFunctionGuard('function')).toBe(false);
      expect(isFunctionGuard(123)).toBe(false);
      expect(isFunctionGuard(true)).toBe(false);
      expect(isFunctionGuard(Symbol('test'))).toBe(false);
    });

    it('should return false for objects with function-like properties', () => {
      const obj = {
        call: () => {},
        apply: () => {},
      };
      expect(isFunctionGuard(obj)).toBe(false);
    });
  });

  describe('isSourceTriggerConfigGuard', () => {
    it('should return true for objects with sourceTriggerConfig property', () => {
      const config = {
        sourceTriggerConfig: {
          trigger: new Subject(),
          operator: 'switchMap' as const,
        },
      };
      expect(isSourceTriggerConfigGuard(config)).toBe(true);
    });

    it('should return false if sourceTriggerConfig is undefined', () => {
      const config = { sourceTriggerConfig: undefined };
      expect(isSourceTriggerConfigGuard(config)).toBe(false);
    });

    it('should return false for objects without sourceTriggerConfig', () => {
      const config = { keepValueOnRefresh: true };
      expect(isSourceTriggerConfigGuard(config)).toBe(false);
    });

    it('should return false for null and undefined', () => {
      expect(isSourceTriggerConfigGuard(null)).toBe(false);
      expect(isSourceTriggerConfigGuard(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isSourceTriggerConfigGuard('string')).toBe(false);
      expect(isSourceTriggerConfigGuard(123)).toBe(false);
      expect(isSourceTriggerConfigGuard(true)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isSourceTriggerConfigGuard([])).toBe(false);
      expect(isSourceTriggerConfigGuard([1, 2, 3])).toBe(false);
    });

    it('should return true for complex sourceTriggerConfig', () => {
      const config = {
        sourceTriggerConfig: {
          trigger: new BehaviorSubject('initial'),
          operator: 'concatMap' as const,
        },
        keepValueOnRefresh: true,
        keepErrorOnRefresh: false,
      };
      expect(isSourceTriggerConfigGuard(config)).toBe(true);
    });
  });
});
