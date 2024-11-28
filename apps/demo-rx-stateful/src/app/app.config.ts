import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from "@angular/common/http";
import { HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import {provideRxStatefulConfig} from "../../../../libs/rx-stateful/src";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    provideAnimations(),
    provideHttpClient(),
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        fullLibraryLoader: () => import('highlight.js')
      }
    },
    provideRxStatefulConfig({
      suspenseTimeMs: 5000,
      suspenseThresholdMs: 8000,
    })
  ],
};
