import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {rxRequest, withRefetchOnTrigger} from "@angular-kit/rx-stateful";
import {map, MonoTypeOperatorFunction, Observable, of, ReplaySubject, scan, share, Subject, switchMap, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";


/**
 * Problem Scenario
 * Wichtig für alle Scenarien: auch 2 Sucbscriber
 * Ziele rxStateful mit flattening ermöglichen u. mutlicasting
 *
 * --> nach error (oder auch complete success?) kann nicht mehr angestoßen werden
 * action.pipe(
 *  concatMap(() => this.blaservice.updateEinschreibung())
 * )
 *
 * UND
 *
 * methode(){
 *   this.blaServcice.updateEinschreibung().subscirbe(d => this.data =d)
 * }
 *
 *
 * BlaService {
 *   updateEinschreibung(){
 *     return rxstateful$(this.httpCall())
 *   }
 * }
 *
 *
 * Als erstes: Komplette grundlagen nochmal
 * stream completed -Y methode und flattening operator was passiert
 * stream error methode und flattening was passiert
 */


@Component({
  selector: 'angular-kit-demo-error-rx-stateful',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <button (click)="id$$.next(1)">trigger</button>
      <button (click)="plainMethod()">plainMethod</button>
      <button (click)="refreshRx$.next(null)">refresh trigger rx</button>
      <button (click)="idRx$$.next(1)">source trigger rx</button>

      <div>
        <div>current id{{id$ | async}}</div>
        <div>
          <h2>only with refresh</h2>
          <ul *ngFor="let v of rxNormal$ | async">
            <li>{{ v | json }}</li>
          </ul>
        </div>
        <hr>
        <div>
          <h2>new source trigger</h2>
          <ul *ngFor="let v of newPlainRx$ | async">
            <li>{{ v | json }}</li>
          </ul>
        </div>
      </div>
    </div>

  `,
  styles: [],
})
export class DemoErrorRxStatefulComponent {
  http = inject(HttpClient)
  action$ = new Subject<any>()

  id$$ = new Subject<number>()
  id$ =  this.id$$.pipe(
    scan((acc, val )=> acc + val, 0)
  )
  plainMethodResult: any = null

  chain$ = this.id$.pipe(
    switchMap(id => of(Math.random()).pipe(
        // share({
        //     connector: () => new ReplaySubject(1),
        //     resetOnRefCountZero: true,
        // }),
      // log('chain inner$')
    )),
   // log('chain$')
      share({
          connector: () => new ReplaySubject(1),
          resetOnRefCountZero: true,
      }),
      tap(x => console.log('chain$ ', x))
  )

  chainError$ = this.id$.pipe(
    switchMap(id => this.http.get(`https://jsonplaceholder.typicode.com/posts/${id}xx`).pipe(
      log('chainError$ inner')
    )),
    log('chainError$ outer')
  )
  plainhttp$ = this.http.get('https://jsonplaceholder.typicode.com/posts/1').pipe(
    log('plainhttp$')
  )

  plainMethod(){
    this.plainhttp$.subscribe(d =>
    this.plainMethodResult = d)
    this.plainhttp$.subscribe()
  }

  refreshRx$ = new Subject<any>()
  idRx$$ = new Subject<number>()
  idRx$ =  this.idRx$$.pipe(
    scan((acc, val )=> acc + val, 0)
  )

  /*chainRx$ = this.idRx$.pipe(
    switchMap(id => rxStateful$(this.http.get(`https://jsonplaceholder.typicode.com/posts/${id}`)).pipe(
        // log('chainRx inner$')
    )),
      scan((acc, value, index) => {
        // @ts-ignore
        acc.push({ index, value });

        return acc;
      }, []),
   // log('chainRx$'),
    share()
  )*/

  rxNormalRequest = rxRequest({
    requestFn: () => this.http.get(`https://jsonplaceholder.typicode.com/posts/1`),
    config: {
      refetchStrategies: [
        withRefetchOnTrigger(this.refreshRx$),
        withRefetchOnTrigger(this.idRx$$),
        //withAutoRefetch(1000, 5000)
      ],
      keepValueOnRefresh: true
    }
  });
  
  rxNormal$ = this.rxNormalRequest.value$().pipe(
      scan((acc, value, index) => {
        // @ts-ignore
        acc.push({ index, value });

        return acc;
      }, []),
      // log('chainRx$'),
  )

  /*chainErrorRx$ = this.idRx$.pipe(
    switchMap(id => rxStateful$(this.http.get(`https://jsonplaceholder.typicode.com/posts/${id}xx`)).pipe(
      log('chainErrorRx$ inner')
    )),
    log('chainErrorRx$ outer')
  )
  plainRx$ = rxStateful$(this.http.get('https://jsonplaceholder.typicode.com/posts/1')).pipe(
    log('plainRx$')
  )*/

  //newPlainRx$ = of(null)

  newPlainRequest = rxRequest({
    trigger: this.idRx$,
    requestFn: (id) => this.http.get(`https://jsonplaceholder.typicode.com/posts/${id}`),
    config: {
      refetchStrategies: withRefetchOnTrigger(this.refreshRx$)
    }
  });
  
  newPlainRx$ = this.newPlainRequest.value$().pipe(
      // log('newPlainRx$'),
      scan((acc, value, index) => {
        // @ts-ignore
        acc.push({ index, value });

        return acc;
      }, [])
  )



  constructor() {
    //this.chainError$.subscribe()
    //this.chainError$.subscribe()

    //this.chainRx$.subscribe()
    //this.chainRx$.subscribe()

    this.newPlainRx$.subscribe()
    this.rxNormal$.subscribe()
      //
      // this.chain$.subscribe()
      // this.chain$.subscribe()
  }



}

function value$(){
  return of(1).pipe(
    map(() => Math.random())
  )
}

export function log<T>(label: string): MonoTypeOperatorFunction<T>{
  return (source: Observable<T>) => source.pipe(
    tap({
       next: v => console.log(`${label} [next] `, v),
       error: e => console.log(`${label} [error] `, e),
       complete: () => console.log(`${label} [complete] `),
       finalize: () => console.log(`${label} [finalize] `),
    })
  )
}
