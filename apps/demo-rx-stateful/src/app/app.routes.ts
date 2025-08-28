import { Route } from '@angular/router';
import {DemoPaginationComponent} from "./demos/demo-pagination.component";
import {DemoBasicUsageComponent} from "./demos/demo-basic-usage.component";
import {AllUseCasesComponent} from "./all-use-cases/all-use-cases.component";
import {DemoAllInOneComponent} from "./demos/demo-all-in-one.component";

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
];
