import { Route } from '@angular/router';
import {DemoPaginationComponent} from "./demos/demo-pagination.component";
import {DemoBasicUsageComponent} from "./demos/demo-basic-usage.component";
import {AllUseCasesComponent} from "./all-use-cases/all-use-cases.component";
import {DemoAllInOneComponent} from "./demos/demo-all-in-one.component";
import {DemoAllInOneTabbedComponent} from "./demos/demo-all-in-one-tabbed.component";
import {DemoAllInOneSidebarComponent} from "./demos/demo-all-in-one-sidebar.component";
import {DemoAllInOneWizardComponent} from "./demos/demo-all-in-one-wizard.component";

export const appRoutes: Route[] = [
  {
    title: 'basic usage',
    path: 'basic-usage',
    component: DemoBasicUsageComponent,
  },
  {
    title: 'pagination',
    path: 'pagination',
    component: DemoPaginationComponent,
  },
  {
    title: 'all-cases',
    path: 'all-cases',
    component: AllUseCasesComponent,
  },
  {
    title: 'all-in-one demo',
    path: 'all-in-one',
    component: DemoAllInOneComponent,
  },
  {
    title: 'all-in-one tabbed',
    path: 'all-in-one-tabbed',
    component: DemoAllInOneTabbedComponent,
  },
  {
    title: 'all-in-one sidebar',
    path: 'all-in-one-sidebar',
    component: DemoAllInOneSidebarComponent,
  },
  {
    title: 'all-in-one wizard',
    path: 'all-in-one-wizard',
    component: DemoAllInOneWizardComponent,
  },
];
