import { Component, ViewChild } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe, NgIf } from '@angular/common';
import { filter, map, shareReplay } from 'rxjs';

import {appRoutes} from "./app.routes";

@Component({
    imports: [
        RouterModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatToolbarModule,
        AsyncPipe,
        NgIf
    ],
    selector: 'navigation',
    template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav"
        [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="(isHandset$ | async) === false">
        <mat-toolbar>Menu</mat-toolbar>
        <mat-nav-list>
          @for (link of links; track link.path) {
            <a mat-list-item
              [routerLink]="link.path"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{exact: true}">
              {{link.title}}
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button
            type="button"
            aria-label="Toggle sidenav"
            mat-icon-button
            (click)="drawer.toggle()"
            *ngIf="isHandset$ | async">
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>
          <span>RxStateful Demos</span>
        </mat-toolbar>

        <div class="content-container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
    `,
    styles: [`
      .sidenav-container {
        height: 100%;
      }

      .sidenav {
        width: 250px;
      }

      .sidenav .mat-toolbar {
        background: inherit;
      }

      .mat-toolbar.mat-primary {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .content-container {
        padding: 20px;
      }

      .active-link {
        background-color: rgba(0, 0, 0, 0.04);
      }

      mat-nav-list a {
        font-size: 14px;
        font-weight: 400;
      }
    `]
})
export class NavigationComponent {
  @ViewChild('drawer') drawer!: MatSidenav;

  links = appRoutes;

  isHandset$ = this.breakpointObserver.observe('(max-width: 768px)')
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    // Close sidenav on mobile after navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter(() => this.breakpointObserver.isMatched('(max-width: 768px)'))
    ).subscribe(() => {
      if (this.drawer) {
        this.drawer.close();
      }
    });
  }
}
