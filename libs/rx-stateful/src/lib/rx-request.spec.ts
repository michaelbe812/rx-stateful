import { rxRequest } from './rx-request';
import { RunHelpers, TestScheduler } from 'rxjs/testing';
import { mergeAll, of, Subject, throwError } from 'rxjs';
import { RxStateful, RxStatefulConfig } from './types/types';
import { withRefetchOnTrigger } from './refetch-strategies/refetch-on-trigger.strategy';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { TestBed } from '@angular/core/testing';
import { provideRxStatefulConfig } from './config/rx-stateful-config';

function test(label: string, callback: () => void) {
  it(label, () => {
    TestBed.runInInjectionContext(callback);
  });
}

describe(rxRequest.name, () => {
  describe('non-flicker suspense not used', () => {
    const defaultConfig: RxStatefulConfig<any> = {
      suspenseTimeMs: 0,
      suspenseThresholdMs: 0,
      keepValueOnRefresh: false,
      keepErrorOnRefresh: false,
    };
    describe('Observable Signature', () => {
      test('should not emit a suspense = true state for sync observable', () => {
        runWithTestScheduler(({ expectObservable }) => {
          const source$ = rxRequest({
            requestFn: () => of(1),
            config: defaultConfig,
          });
          const expected = 's';

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              s: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });

      test('should correctly handle falsy values (0, false, empty string)', () => {
        runWithTestScheduler(({ expectObservable }) => {
          const source0$ = rxRequest({
            requestFn: () => of(0),
            config: defaultConfig,
          });
          const sourceFalse$ = rxRequest({
            requestFn: () => of(false),
            config: defaultConfig,
          });
          const sourceEmpty$ = rxRequest({
            requestFn: () => of(''),
            config: defaultConfig,
          });

          const expected = 's';

          expectObservable(source0$.value$()).toBe(
            expected,
            marbelize({
              s: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 0,
                hasValue: true,
                isSuspense: false,
              },
            })
          );

          expectObservable(sourceFalse$.value$()).toBe(
            expected,
            marbelize({
              s: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: false,
                hasValue: true,
                isSuspense: false,
              },
            })
          );

          expectObservable(sourceEmpty$.value$()).toBe(
            expected,
            marbelize({
              s: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: '',
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });

      // TODO
      // test('underlying source$ should be multicasted', () => {
      //
      // });
      describe('Using refreshTrigger', () => {
        test('should emit the correct state when using a refreshTrigger ', () => {
          runWithTestScheduler(({ expectObservable, cold }) => {
            const s$ = cold('-a|', { a: 1 });
            const refresh$ = cold('---a-', { a: void 0 });
            const expected = 'sa-sb-';
            const source$ = rxRequest({
              requestFn: () => s$,
              config: {
                ...defaultConfig,
                refetchStrategies: withRefetchOnTrigger(refresh$),
              },
            });

            expectObservable(source$.value$()).toBe(
              expected,
              marbelize({
                s: {
                  hasError: false,
                  error: undefined,
                  context: 'suspense',
                  value: null,
                  hasValue: false,
                  isSuspense: true,
                },
                a: {
                  hasError: false,
                  error: undefined,
                  context: 'next',
                  value: 1,
                  hasValue: true,
                  isSuspense: false,
                },
                b: {
                  hasError: false,
                  error: undefined,
                  context: 'next',
                  value: 1,
                  hasValue: true,
                  isSuspense: false,
                },
              })
            );
          });
        });
        test('should keep the value on refresh when keepValueOnRefresh = true', () => {
          runWithTestScheduler(({ expectObservable, cold }) => {
            const s$ = cold('-a|', { a: 1 });
            const refresh$ = cold('---a-', { a: void 0 });
            const expected = 'za-yb-';
            // const source$ = rxStatefulRequest(s$, {
            //   ...defaultConfig,
            //   keepValueOnRefresh: true,
            //   refetchStrategies: withRefetchOnTrigger(refresh$)
            // });
            const source$ = rxRequest({
              requestFn: () => s$,
              config: {
                ...defaultConfig,
                keepValueOnRefresh: true,
                refetchStrategies: withRefetchOnTrigger(refresh$),
              },
            });

            expectObservable(source$.value$()).toBe(
              expected,
              marbelize({
                z: {
                  hasError: false,
                  error: undefined,
                  context: 'suspense',
                  // TODO in this case why is value not null initially?
                  // value: null,
                  hasValue: false,
                  isSuspense: true,
                },
                y: {
                  hasError: false,
                  error: undefined,
                  context: 'suspense',
                  value: 1,
                  hasValue: true,
                  isSuspense: true,
                },
                a: {
                  hasError: false,
                  error: undefined,
                  context: 'next',
                  value: 1,
                  hasValue: true,
                  isSuspense: false,
                },
                b: {
                  hasError: false,
                  error: undefined,
                  context: 'next',
                  value: 1,
                  hasValue: true,
                  isSuspense: false,
                },
              })
            );
          });
        });
      });
    });

    describe('Callback Signature', () => {
      test('should not emit a suspense = true state for sync observables', () => {
        runWithTestScheduler(({ expectObservable, cold }) => {
          const trigger = cold('a--b', { a: 1, b: 2 });
          const source$ = rxRequest({
            trigger,
            requestFn: (n) => of(n),
            config: {
              ...defaultConfig,
            },
          });

          const expected = 'a--b';

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 2,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
      // TODO
      // test('underlying source$ should be multicasted', () => {
      //
      // });
      test('should emit correct state when sourceTrigger emits and when a refetch is happening', () => {
        runWithTestScheduler(({ expectObservable, cold }) => {
          /**
           * trigger    -a-----b-
           * refresh    ---a-----
           * expected   -sasa--sb
           *
           * s$         -a            (takes 1 frame and then emit value)
           */
          const trigger = cold('-a-----b-', { a: 1, b: 2 });
          const refresh = cold('---a-', { a: void 0 });
          const s$ = (n: number) => cold('-a', { a: n });
          const expected = '-sasa--sb';

          const source$ = rxRequest({
            trigger,
            requestFn: (n) => s$(n),
            config: {
              ...defaultConfig,
              refetchStrategies: [withRefetchOnTrigger(refresh)],
            },
          });

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              s: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: null,
                hasValue: false,
                isSuspense: true,
              },
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 2,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
      test('should keep the value on refresh when keepValueOnRefresh = true', () => {
        runWithTestScheduler(({ expectObservable, cold }) => {
          /**
           * trigger    -a-----b-
           * refresh    ---a-----
           * expected   -sasa--sb
           *
           * s$         -a            (takes 1 frame and then emit value)
           */
          const trigger = cold('-a-----b-', { a: 1, b: 2 });
          const refresh = cold('---a-', { a: void 0 });
          const s$ = (n: number) => cold('-a', { a: n });
          const expected = '-zaxa--xb';

          const source$ = rxRequest({
            trigger,
            requestFn: (n) => s$(n),
            config: { ...defaultConfig, keepValueOnRefresh: true, refetchStrategies: [withRefetchOnTrigger(refresh)] },
          });

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              z: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                // value: null,
                hasValue: false,
                isSuspense: true,
              },
              x: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: 1,
                hasValue: true,
                isSuspense: true,
              },
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 2,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
    });

    describe('Error Handling', () => {
      describe('Observable Signature', () => {
        describe('When error happens', () => {
          test('should handle error and operate correctly afterwards', () => {
            runWithTestScheduler(({ expectObservable, cold }) => {
              const error = new Error('oops');
              const s$ = cold('-#', {}, error);
              const refresh$ = cold('---a-', { a: void 0 });
              const expected = 'sa-sa-';

              const source$ = rxRequest({
                requestFn: () => s$,
                config: {
                  ...defaultConfig,
                  refetchStrategies: [withRefetchOnTrigger(refresh$)],
                },
              });

              expectObservable(source$.value$()).toBe(
                expected,
                marbelize({
                  s: {
                    hasError: false,
                    error: undefined,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  a: {
                    hasError: true,
                    error: error,
                    context: 'error',
                    value: null,
                    hasValue: false,
                    isSuspense: false,
                  },
                })
              );
            });
          });
          test('should keep the error on refresh when keepErrorOnRefresh = true', () => {
            runWithTestScheduler(({ expectObservable, cold }) => {
              const error = new Error('oops');
              const s$ = cold('-#', {}, error);
              const refresh$ = cold('---a-', { a: void 0 });
              const expected = 'za-ya-';

              const source$ = rxRequest({
                requestFn: () => s$,
                config: {
                  ...defaultConfig,
                  keepErrorOnRefresh: true,
                  refetchStrategies: [withRefetchOnTrigger(refresh$)],
                },
              });

              expectObservable(source$.value$()).toBe(
                expected,
                marbelize({
                  z: {
                    hasError: false,
                    error: undefined,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  y: {
                    hasError: true,
                    error: error,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  a: {
                    hasError: true,
                    error: error,
                    context: 'error',
                    value: null,
                    hasValue: false,
                    isSuspense: false,
                  },
                })
              );
            });
          });
          test('should execute beforeHandleErrorFn', () => {
            const source$ = new Subject<any>();
            const beforeHandleErrorFn = vi.fn();

            const result = subscribeSpyTo(
              rxRequest({
                requestFn: () => source$.pipe(mergeAll()),
                config: {
                  ...defaultConfig,
                  beforeHandleErrorFn,
                },
              }).value$()
            );

            source$.next(throwError(() => new Error('error')));

            expect(beforeHandleErrorFn).toHaveBeenCalledWith(Error('error'));
            expect(beforeHandleErrorFn).toHaveBeenCalledTimes(1);
          });
          test('should use errorMappingFn', () => {
            runWithTestScheduler(({ expectObservable, cold }) => {
              const error = new Error('oops');
              const s$ = cold('-#', {}, error);
              const refresh$ = cold('---a-', { a: void 0 });
              const expected = 'sa-sa-';

              const source$ = rxRequest<any, any, any>({
                requestFn: () => s$,
                config: {
                  ...defaultConfig,
                  errorMappingFn: (error: Error) => error.message,
                  refetchStrategies: [withRefetchOnTrigger(refresh$)],
                },
              });

              expectObservable(source$.value$()).toBe(
                expected,
                marbelize({
                  s: {
                    hasError: false,
                    error: undefined,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  a: {
                    hasError: true,
                    error: error.message,
                    context: 'error',
                    value: null,
                    hasValue: false,
                    isSuspense: false,
                  },
                })
              );
            });
          });
        });
      });
      describe('Callback Signature', () => {
        describe('When error happens', () => {
          test('should handle error and operate correctly afterwards', () => {
            runWithTestScheduler(({ expectObservable, cold }) => {
              const error = new Error('oops');
              const s$ = cold('-#', {}, error);
              const trigger$ = cold('a---a-', { a: 1 });
              const expected = 'sa--sa-';

              const source$ = rxRequest({
                trigger: trigger$,
                requestFn: (n: number) => s$,
                config: {
                  ...defaultConfig,
                },
              });

              expectObservable(source$.value$()).toBe(
                expected,
                marbelize({
                  s: {
                    hasError: false,
                    error: undefined,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  a: {
                    hasError: true,
                    error: error,
                    context: 'error',
                    value: null,
                    hasValue: false,
                    isSuspense: false,
                  },
                })
              );
            });
          });
          test('should keep the error on refresh when keepErrorOnRefresh = true', () => {
            runWithTestScheduler(({ expectObservable, cold }) => {
              const error = new Error('oops');
              const s$ = cold('-#', {}, error);
              const trigger$ = cold('a---a-', { a: 1 });
              const expected = 'za--ya-';

              const source$ = rxRequest({
                trigger: trigger$,
                requestFn: (n: number) => s$,
                config: {
                  ...defaultConfig,
                  keepErrorOnRefresh: true,
                },
              });

              expectObservable(source$.value$()).toBe(
                expected,
                marbelize({
                  z: {
                    hasError: false,
                    error: undefined,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  y: {
                    hasError: true,
                    error: error,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  a: {
                    hasError: true,
                    error: error,
                    context: 'error',
                    value: null,
                    hasValue: false,
                    isSuspense: false,
                  },
                })
              );
            });
          });
          test('should execute beforeHandleErrorFn', () => {
            const trigger$ = new Subject<any>();
            const beforeHandleErrorFn = vi.fn();

            const source$ = subscribeSpyTo(
              rxRequest({
                trigger: trigger$,
                requestFn: () => throwError(() => new Error('error')),
                config: {
                  ...defaultConfig,
                  beforeHandleErrorFn,
                },
              }).value$()
            );

            trigger$.next(null);

            expect(beforeHandleErrorFn).toHaveBeenCalledWith(Error('error'));
            // TODO this needs investigation
            expect(beforeHandleErrorFn).toHaveBeenCalledTimes(2);
          });
          test('should use errorMappingFn', () => {
            runWithTestScheduler(({ expectObservable, cold }) => {
              const error = new Error('oops');
              const s$ = cold('-#', {}, error);
              const trigger$ = cold('a---a-', { a: 1 });
              const expected = 'sa--sa-';

              const source$ = rxRequest({
                trigger: trigger$,
                requestFn: (n: number) => s$,
                config: {
                  ...defaultConfig,
                  // @ts-ignore
                  errorMappingFn: (error: Error) => error.message,
                },
              });

              expectObservable(source$.value$()).toBe(
                expected,
                marbelize({
                  s: {
                    hasError: false,
                    error: undefined,
                    context: 'suspense',
                    value: null,
                    hasValue: false,
                    isSuspense: true,
                  },
                  a: {
                    hasError: true,
                    error: error.message,
                    context: 'error',
                    value: null,
                    hasValue: false,
                    isSuspense: false,
                  },
                })
              );
            });
          });
        });
      });
    });
  });
  describe('using non-flicker suspense', () => {
    const defaultConfig: RxStatefulConfig<any> = {
      suspenseTimeMs: 2,
      suspenseThresholdMs: 2,
      keepValueOnRefresh: false,
      keepErrorOnRefresh: false,
    };
    describe('Observable Signature', () => {
      test('should not emit suspense state when source emits before suspenseThreshold is exceeded', () => {
        /**
         * s$         -a
         * refresh    ----a
         * expected   -a--a
         */
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = cold('-a|', { a: 1 });
          const refresh$ = cold('----a-', { a: void 0 });
          const expected = '-a---';

          const source$ = rxRequest({
            requestFn: () => s$,
            config: {
              ...defaultConfig,
              refetchStrategies: [withRefetchOnTrigger(refresh$)],
            },
          });
          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
      test('should should emit suspense state when source emits after suspenseThreshold is exceeded', () => {
        /**
         * s$         ---a
         * expected   ---s--a
         */
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = cold('---a|', { a: 1 });
          const expected = '--s-a';

          const source$ = rxRequest({
            requestFn: () => s$,
            config: {
              ...defaultConfig,
            },
          });

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              s: {
                hasError: false,
                hasValue: false,
                value: null,
                context: 'suspense',
                isSuspense: true,
                error: undefined,
              },
            })
          );
        });
      });
      test('should keep suspense state as long as source takes when it takes longer than supsenseThreshold + suspenseTime', () => {
        /**
         * s$         ------a
         * expected   --s---a
         */
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = cold('------a|', { a: 1 });
          const expected = '--s---a';

          const source$ = rxRequest({
            requestFn: () => s$,
            config: {
              ...defaultConfig,
            },
          });
          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              s: {
                hasError: false,
                hasValue: false,
                value: null,
                context: 'suspense',
                isSuspense: true,
                error: undefined,
              },
            })
          );
        });
      });
    });
    describe('Callback Signature', () => {
      test('should not emit suspense state when source emits before suspenseThreshold is exceeded', () => {
        /**
         * s$         -a
         * trigger$   a--b-
         * expected   -a--b
         */
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = (n: number) => cold('-a|', { a: n });
          const trigger$ = cold('a--b-', { a: 1, b: 2 });
          const expected = '-a--b';

          const source$ = rxRequest({
            trigger: trigger$,
            requestFn: (n) => s$(n),
            config: {
              ...defaultConfig,
            },
          });

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 2,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
      test('should should emit suspense state when source emits after suspenseThreshold is exceeded', () => {
        /**
         * s$         --a
         * trigger$   a----b------
         * expected   --s--a--s--a
         */
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = (n: number) => cold('---a|', { a: n });
          const trigger$ = cold('a----b------', { a: 1, b: 2 });
          const expected = '--s-a--s-b';

          const source$ = rxRequest({
            trigger: trigger$,
            requestFn: (n) => s$(n),
            config: {
              ...defaultConfig,
            },
          });
          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 2,
                hasValue: true,
                isSuspense: false,
              },
              s: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: null,
                hasValue: false,
                isSuspense: true,
              },
            })
          );
        });
      });
      test('should keep suspense state as long as source takes when it takes longer than supsenseThreshold + suspenseTime', () => {
        /**
         * s$         ------a
         * trigger$   a--------b-------
         * expected   --s---a----s---b-----
         */
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = (n: number) => cold('------a|', { a: n });
          const trigger$ = cold('a--------b-------', { a: 1, b: 2 });
          const expected = '--s---a----s---b-----';
          const source$ = rxRequest({
            trigger: trigger$,
            requestFn: (n) => s$(n),
            config: {
              ...defaultConfig,
            },
          });
          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 2,
                hasValue: true,
                isSuspense: false,
              },
              s: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: null,
                hasValue: false,
                isSuspense: true,
              },
            })
          );
        });
      });
    });
  });

  describe('config', () => {
    const defaultConfig: RxStatefulConfig<any> = {
      suspenseTimeMs: 0,
      suspenseThresholdMs: 0,
      keepValueOnRefresh: false,
      keepErrorOnRefresh: false,
    };
    it('should apply global config', async () => {
      await TestBed.configureTestingModule({
        providers: [provideRxStatefulConfig({ keepValueOnRefresh: true })],
      }).compileComponents();
      TestBed.runInInjectionContext(() => {
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = cold('-a|', { a: 1 });
          const refresh$ = cold('---a-', { a: void 0 });
          const expected = 'za-yb-';

          const source$ = rxRequest({
            requestFn: () => s$,
            config: {
              suspenseTimeMs: 0,
              suspenseThresholdMs: 0,
              keepErrorOnRefresh: false,
              refetchStrategies: withRefetchOnTrigger(refresh$),
            },
          });

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              z: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                // value: null,
                hasValue: false,
                isSuspense: true,
              },
              y: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: 1,
                hasValue: true,
                isSuspense: true,
              },
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
    });
    it('should override global config with options', async () => {
      await TestBed.configureTestingModule({
        providers: [provideRxStatefulConfig({ keepValueOnRefresh: true })],
      }).compileComponents();
      TestBed.runInInjectionContext(() => {
        runWithTestScheduler(({ expectObservable, cold }) => {
          const s$ = cold('-a|', { a: 1 });
          const refresh$ = cold('---a-', { a: void 0 });
          const expected = 'za-yb-';

          const source$ = rxRequest({
            requestFn: () => s$,
            config: {
              ...defaultConfig,
              keepValueOnRefresh: false,
              refetchStrategies: withRefetchOnTrigger(refresh$),
            },
          });

          expectObservable(source$.value$()).toBe(
            expected,
            marbelize({
              z: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: null,
                hasValue: false,
                isSuspense: true,
              },
              y: {
                hasError: false,
                error: undefined,
                context: 'suspense',
                value: null,
                hasValue: false,
                isSuspense: true,
              },
              a: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
              b: {
                hasError: false,
                error: undefined,
                context: 'next',
                value: 1,
                hasValue: true,
                isSuspense: false,
              },
            })
          );
        });
      });
    });
  });
});

function runWithTestScheduler<T>(callback: (helpers: RunHelpers) => T) {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });

  return testScheduler.run(callback);
}

function marbelize(marbles: Record<string, Partial<RxStateful<any>>>) {
  return marbles;
}
