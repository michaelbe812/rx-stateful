import { Component, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of, OperatorFunction, scan, Subject, switchMap, timer } from 'rxjs';
import { rxRequest, RxStateful, withAutoRefetch, withRefetchOnTrigger } from '@angular-kit/rx-stateful';
import { RxStatefulStateVisualizerComponent } from './rx-stateful-state-visualizer.component';
import { NonFlickerComponent } from './non-flicker/non-flicker.component';

type Data = {
  id: number;
  name: string;
};

const DATA: Data[] = [
  { id: 1, name: 'ahsd' },
  { id: 2, name: 'asdffdsa' },
  { id: 3, name: 'eeasdf' },
];

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);

  getData(opts?: { delay?: number }) {
    return timer(opts?.delay ?? 1000).pipe(switchMap(() => of(DATA)));
  }

  getById(id: number, opts?: { delay?: number }) {
    return timer(opts?.delay ?? 1000).pipe(switchMap(() => of(DATA.find((v) => v.id === id))));
  }
}

@Component({
    selector: 'demo-all-use-cases',
    imports: [CommonModule, RxStatefulStateVisualizerComponent, NonFlickerComponent],
    templateUrl: './all-use-cases.component.html',
    styleUrl: './all-use-cases.component.scss'
})
export class AllUseCasesComponent {
  private readonly http = inject(HttpClient);
  private readonly data = inject(DataService);
  readonly refresh$$ = new Subject<null>();
  refreshInterval = 10000;
  /**
   * Für alle Use Cases eine demo machen
   */

  /**
   * Case 1
   * Basic Usage with automatic refetch and a refreshtrigger
   */

  case1 = rxRequest<Data[], undefined, Error>({
    requestFn: () => this.data.getData(),
    config: {
      refetchStrategies: [
        withRefetchOnTrigger(this.refresh$$),
        //withAutoRefetch(this.refreshInterval, 1000000)
      ],
      suspenseThresholdMs: 0,
      suspenseTimeMs: 0,
      keepValueOnRefresh: false,
      keepErrorOnRefresh: false,
      errorMappingFn: (error) => error.message,
    },
  }).value$().pipe(
    collectState()
  );

  /**
   * Case Basic Usage non flickering
   */

  /**
   * Case Basic Usage flaky API
   */
  //case2$

  /**
   * Case - sourcetrigger function
   */

  /**
   * Case  - sourcetrigger function non flickering
   */

  /**
   * Case - sourcetrigger function flaky api
   */

  /**
   * Case Bug Reproduction  https://github.com/mikelgo/angular-kit/issues/111
   */

  deleteAction$ = new Subject<number>();

  delete$ = rxRequest({
    requestFn:  (id) => timer(1000).pipe(switchMap(() => of(null))),
    trigger: this.deleteAction$,
    config: {
      suspenseTimeMs: 0,
      suspenseThresholdMs: 0,
      operator: 'switch',
    }
  }).value$().pipe(collectState())

  /**
   * Case Normal for Bug repro
   */
  refresh$ = new Subject<null>();


  two$ = rxRequest({
    requestFn: () => timer(1000).pipe(switchMap(() => of(null))),
    config: {refetchStrategies: [withRefetchOnTrigger(this.refresh$)]}
  }).value$().pipe(collectState());
}

function collectState(): OperatorFunction<
  RxStateful<any>,
  {
    index: number;
    value: RxStateful<any>;
  }[]
> {
  return scan<
    RxStateful<any>,
    {
      index: number;
      value: RxStateful<any>;
    }[]
  >((acc, value, index) => {
    // @ts-ignore
    acc.push({ index, value });

    return acc;
  }, []);
}
