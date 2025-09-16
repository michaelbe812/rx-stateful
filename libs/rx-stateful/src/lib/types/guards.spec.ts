import { describe, expect, it } from 'vitest';
import { Observable, Subject, of, BehaviorSubject, ReplaySubject } from 'rxjs';
import {
  isObservableOrSubjectGuard,
  isRxStatefulConfigOrObsGuard,
  isRxStatefulConfigOrSourceTriggerConfigGuard,
  isFunctionGuard,
  isSourceTriggerConfigGuard,
} from './guards';

describe('Type Guards', () => {
  describe('isObservableOrSubjectGuard', () => {
    it('should return true for Observable', () => {
      const obs = of(1, 2, 3);
      expect(isObservableOrSubjectGuard(obs)).toBe(true);
    });

    it('should return true for Subject', () => {
      const subject = new Subject();
      expect(isObservableOrSubjectGuard(subject)).toBe(true);
    });

    it('should return true for BehaviorSubject', () => {
      const behaviorSubject = new BehaviorSubject(0);
      expect(isObservableOrSubjectGuard(behaviorSubject)).toBe(true);
    });

    it('should return true for ReplaySubject', () => {
      const replaySubject = new ReplaySubject(1);
      expect(isObservableOrSubjectGuard(replaySubject)).toBe(true);
    });

    it('should return false for non-Observable values', () => {
      expect(isObservableOrSubjectGuard(null)).toBe(false);
      expect(isObservableOrSubjectGuard(undefined)).toBe(false);
      expect(isObservableOrSubjectGuard({})).toBe(false);
      expect(isObservableOrSubjectGuard([])).toBe(false);
      expect(isObservableOrSubjectGuard('string')).toBe(false);
      expect(isObservableOrSubjectGuard(123)).toBe(false);
      expect(isObservableOrSubjectGuard(() => {})).toBe(false);
    });

    it('should return true for custom Observable-like objects', () => {
      const customObservable = new Observable(() => {});
      expect(isObservableOrSubjectGuard(customObservable)).toBe(true);
    });
  });

  describe('isRxStatefulConfigOrObsGuard', () => {
    it('should return true for config objects', () => {
      const config = { keepValueOnRefresh: true };
      expect(isRxStatefulConfigOrObsGuard(config)).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isRxStatefulConfigOrObsGuard({})).toBe(true);
    });

    it('should return false for Observables', () => {
      const obs = of(1, 2, 3);
      expect(isRxStatefulConfigOrObsGuard(obs)).toBe(false);
    });

    it('should return false for Subjects', () => {
      const subject = new Subject();
      expect(isRxStatefulConfigOrObsGuard(subject)).toBe(false);
    });

    it('should return true for non-Observable values', () => {
      expect(isRxStatefulConfigOrObsGuard('string')).toBe(true);
      expect(isRxStatefulConfigOrObsGuard(123)).toBe(true);
      expect(isRxStatefulConfigOrObsGuard(null)).toBe(true);
      expect(isRxStatefulConfigOrObsGuard(undefined)).toBe(true);
    });

    it('should return true for complex config objects', () => {
      const config = {
        keepValueOnRefresh: true,
        keepErrorOnRefresh: false,
        errorMappingFn: (err: any) => err,
        accumulationFn: (acc: any, val: any) => ({ ...acc, ...val }),
      };
      expect(isRxStatefulConfigOrObsGuard(config)).toBe(true);
    });
  });

  describe('isRxStatefulConfigOrSourceTriggerConfigGuard', () => {
    it('should return true for objects with trigger property', () => {
      const config = { trigger: new Subject() };
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(config)).toBe(true);
    });

    it('should return false if trigger is undefined', () => {
      const config = { trigger: undefined };
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(config)).toBe(false);
    });

    it('should return false for objects without trigger', () => {
      const config = { keepValueOnRefresh: true };
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(config)).toBe(false);
    });

    it('should return false for null and undefined', () => {
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(null)).toBe(false);
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(undefined)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard('string')).toBe(false);
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(123)).toBe(false);
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard(true)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard([])).toBe(false);
      expect(isRxStatefulConfigOrSourceTriggerConfigGuard([1, 2, 3])).toBe(false);
    });
  });

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
