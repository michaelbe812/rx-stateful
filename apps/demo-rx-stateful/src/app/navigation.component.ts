import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {MatTabsModule} from "@angular/material/tabs";

import {appRoutes} from "./app.routes";

@Component({
    imports: [RouterModule, MatTabsModule],
    selector: 'navigation',
    template: `
    <nav mat-tab-nav-bar  [tabPanel]="tabPanel">
      @for (link of links; track link) {
        <a mat-tab-link
          (click)="activeLink = link"
          [active]="activeLink == link"
        [routerLink]="link.path"> {{link.title}} </a>
      }
    
    </nav>
    <mat-tab-nav-panel #tabPanel>
      <router-outlet></router-outlet>
    </mat-tab-nav-panel>
    `,
    styles: [``]
})
export class NavigationComponent {

  title = 'demo-rx-stateful';
  links = appRoutes

  activeLink = this.links[0];
}
