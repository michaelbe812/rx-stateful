import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {NavigationComponent} from "./navigation.component";
import {rxRequest, withRefetchOnTrigger} from "@angular-kit/rx-stateful";
import {BehaviorSubject, map, of, scan, startWith, Subject, timer} from "rxjs";
import {AsyncPipe, JsonPipe} from "@angular/common";

@Component({
    imports: [RouterModule, NavigationComponent, AsyncPipe, JsonPipe],
    selector: 'demo-root',
    template: `
    <h1>RxStateful Demo</h1>
    <p>Select one of the demos from the tabs below</p>
    <navigation />

<!--    <button (click)="refresh$$.next()">Refresh</button>-->
<!--    <button (click)="page$$.next(1)">next page</button>-->
<!--    {{ req.value$() | async | json }}-->
<!--    <br>-->
<!--    <hr>-->
<!--    {{ req2.value$() | async | json }}-->
  `,
    styles: [
        `
      :host {
        display: block;
        padding: 32px 64px 32px 64px;
      }
    `,
    ]
})
export class AppComponent {
  title = 'demo-rx-stateful';
  refresh$$ = new Subject<void>();

  page$$ = new BehaviorSubject<number>(1);

  page$ = this.page$$.pipe(scan((acc) => acc + 1, 0));
  stateful = rxRequest({
    requestFn: () => of('Hello'),
    config: {keepErrorOnRefresh: true}
  })
  req = rxRequest({
    requestFn: () => timer(10).pipe(map(() => 'Hello')),
    config: {
      refetchStrategies: [withRefetchOnTrigger(this.refresh$$)],
    },
  });

  req2 = rxRequest({
    trigger: this.page$,
    requestFn: (page) => timer(10).pipe(map(() => page)),
    config: {
      refetchStrategies: [withRefetchOnTrigger(this.refresh$$)],
    },
  });

  constructor() {
    this.req.value$().subscribe((x) => console.log('App ', x));
    this.page$.subscribe((x) => console.log('Page ', x));
    this.req2.value$().subscribe((x) => console.log('App2 ', x));
  }
}
