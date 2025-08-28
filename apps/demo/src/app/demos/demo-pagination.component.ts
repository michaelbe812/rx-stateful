import {Component, inject, ViewChild, AfterViewInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import {MatExpansionModule} from "@angular/material/expansion";
import {HighlightModule} from "ngx-highlightjs";
import { HttpClient } from "@angular/common/http";
import {BehaviorSubject, delay, Observable, scan, Subject, switchMap} from "rxjs";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {Todo} from "../types";
import {rxRequest, withRefetchOnTrigger} from "@angular-kit/rx-stateful";
import { DataSource } from '@angular/cdk/collections';
import {MatButtonModule} from "@angular/material/button";
import { AsyncPipe } from "@angular/common";
import {MatListModule} from "@angular/material/list";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {TodoItemComponent} from "./todo-item.component";
import {MatCardModule} from "@angular/material/card";




@Component({
    imports: [RouterModule, MatExpansionModule, HighlightModule, MatPaginatorModule, MatTableModule, MatButtonModule, AsyncPipe, MatListModule, MatProgressSpinnerModule, TodoItemComponent, MatCardModule],
    selector: 'demo-pagination',
    template: `
     <h1>Pagination Example</h1>
     <div>
       <p>Change pages by clicking next or previous page</p>
       <p>You can refetch the list by pressing refresh</p>
     </div>
     <div class="w-full flex gap-8">
       <button mat-button color="primary" (click)="page$$.next(-1)"> previous page </button>
       <button mat-button color="primary" (click)="page$$.next(1)"> next page </button>
       <button mat-button color="primary" (click)="request.refresh()"> Refresh current page </button>
       @if (page$ | async; as page) {
         <button mat-button color="primary">    Current Page: {{page}} </button>
       }
     
     </div>
     <mat-expansion-panel>
       <mat-expansion-panel-header>
         Code example
       </mat-expansion-panel-header>
       <pre><code [highlight]="code"></code></pre>
     </mat-expansion-panel>
     <div>
       <mat-card class="px-8 py-4 h-[350px]">
         <h2>Todos</h2>
         @if (request.value$() | async; as state) {
           <div>
             @if (state.value) {
               <div class="list-container">
                 <mat-list role="list" >
                   @for (item of state.value; track item) {
                     <mat-list-item role="listitem">
                       <todo-item [todo]="item"/>
                     </mat-list-item>
                   }
                 </mat-list>
               </div>
             }
             @if (state.isSuspense) {
               <div class="w-full h-full grid place-items-center\t">
                 <mat-spinner></mat-spinner>
               </div>
             }
             @if (state.hasError) {
               <div>
                 Error {{state.error}}
               </div>
             }
           </div>
         }
       </mat-card>
     </div>
     `,
    styles: ['']
})
export class DemoPaginationComponent   {
  code = `
  private readonly http = inject(HttpClient)

  readonly page$$ = new BehaviorSubject(0)
  readonly page$ = this.page$$.pipe(
    scan((acc, curr) => acc + curr, 0)
  )

  request = rxRequest({
    trigger: this.page$,
    requestFn: (page) => this.http.get<Todo[]>(\`https://jsonplaceholder.typicode.com/todos?_start=page&_limit=5\`).pipe(
      // artificial delay
      delay(500)
    ),
  })



  `
  private readonly http = inject(HttpClient)
  readonly page$$ = new BehaviorSubject(0)
  readonly page$ = this.page$$.pipe(
    scan((acc, curr) => acc + curr, 0)
  )

  request = rxRequest({
    trigger: this.page$,
    requestFn:  (page) => this.http.get<Todo[]>(`https://jsonplaceholder.typicode.com/todos?_start=${page * 5}&_limit=5`).pipe(
      // artificial delay
      delay(500)
    ),
  })

}
