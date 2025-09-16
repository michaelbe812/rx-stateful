import { TestBed } from '@angular/core/testing';
import { inject } from '@angular/core';
import { RX_STATEFUL_CONFIG, provideRxStatefulConfig, Config } from './rx-stateful-config';

describe('RX_STATEFUL_CONFIG', () => {
  it('should provide and inject config correctly', () => {
    const testConfig: Partial<Config<any, any>> = {
      keepErrorOnRefresh: true,
      keepValueOnRefresh: false,
      suspenseTimeMs: 1000,
    };

    TestBed.configureTestingModule({
      providers: [provideRxStatefulConfig(testConfig)],
    });

    TestBed.runInInjectionContext(() => {
      const injectedConfig = inject(RX_STATEFUL_CONFIG, { optional: true });
      expect(injectedConfig).toBeDefined();
      expect(injectedConfig?.keepErrorOnRefresh).toBe(true);
      expect(injectedConfig?.keepValueOnRefresh).toBe(false);
      expect(injectedConfig?.suspenseTimeMs).toBe(1000);
    });
  });

  it('should return null when config is not provided', () => {
    TestBed.configureTestingModule({
      providers: [],
    });

    TestBed.runInInjectionContext(() => {
      const injectedConfig = inject(RX_STATEFUL_CONFIG, { optional: true });
      expect(injectedConfig).toBeNull();
    });
  });
});
