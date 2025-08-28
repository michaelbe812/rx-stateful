import { Component, inject, Injector } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { HighlightModule } from 'ngx-highlightjs';
import { combineLatest, map, startWith, Subject, switchMap, throwError, timer } from 'rxjs';
import { rxRequest, withAutoRefetch, withRefetchOnTrigger } from '@angular-kit/rx-stateful';
import { Todo } from '../types';
import { TodoItemComponent } from './todo-item.component';

@Component({
  selector: 'demo-all-in-one-sidebar',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    HighlightModule,
    TodoItemComponent,
  ],
  template: `
    <h1>All-in-One rxRequest Demo - Sidebar Layout</h1>
    <p>Navigate through configuration sections using the sidebar. Same features as the original demo with a different layout.</p>

    <div class="sidebar-container">
      <mat-sidenav-container class="sidenav-container">
        <!-- Sidebar Navigation -->
        <mat-sidenav
          mode="side"
          opened
          class="sidebar"
          fixedInViewport="false">
          <mat-nav-list>
            <h3 matSubheader>Configuration Sections</h3>
            <mat-list-item 
              [class.active]="activeSection === 'request'" 
              (click)="setActiveSection('request')">
              <mat-icon matListItemIcon>settings</mat-icon>
              <span matListItemTitle>Request Setup</span>
            </mat-list-item>
            <mat-list-item 
              [class.active]="activeSection === 'state'" 
              (click)="setActiveSection('state')">
              <mat-icon matListItemIcon>memory</mat-icon>
              <span matListItemTitle>State Management</span>
            </mat-list-item>
            <mat-list-item 
              [class.active]="activeSection === 'api'" 
              (click)="setActiveSection('api')">
              <mat-icon matListItemIcon>cloud</mat-icon>
              <span matListItemTitle>API Simulation</span>
            </mat-list-item>
            <mat-list-item 
              [class.active]="activeSection === 'refetch'" 
              (click)="setActiveSection('refetch')">
              <mat-icon matListItemIcon>refresh</mat-icon>
              <span matListItemTitle>Refetch Strategies</span>
            </mat-list-item>
            <mat-list-item 
              [class.active]="activeSection === 'code'" 
              (click)="setActiveSection('code')">
              <mat-icon matListItemIcon>code</mat-icon>
              <span matListItemTitle>Generated Code</span>
            </mat-list-item>
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content Area -->
        <mat-sidenav-content class="main-content">
          <div class="content-grid">
            <!-- Configuration Section -->
            <mat-card class="config-section">
              @switch (activeSection) {
                @case ('request') {
                <mat-card-header>
                  <mat-card-title>Request Setup</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="configForm" class="config-form">
                    <div class="form-section">
                      <h3>Request Type</h3>
                      <mat-radio-group formControlName="requestType">
                        <mat-radio-button value="simple">Simple Request (no trigger)</mat-radio-button>
                        <mat-radio-button value="triggered">Triggered Request</mat-radio-button>
                      </mat-radio-group>
                    </div>

                    @if (configForm.get('requestType')?.value === 'triggered') {
                    <div class="form-section">
                      <h3>Operator</h3>
                      <mat-select formControlName="operator">
                        <mat-option value="switch">switch</mat-option>
                        <mat-option value="merge">merge</mat-option>
                        <mat-option value="concat">concat</mat-option>
                        <mat-option value="exhaust">exhaust</mat-option>
                      </mat-select>
                    </div>
                    }
                  </form>
                </mat-card-content>
                }

                @case ('state') {
                <mat-card-header>
                  <mat-card-title>State Management</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="configForm" class="config-form">
                    <div class="form-section">
                      <h3>Value & Error Persistence</h3>
                      <mat-checkbox formControlName="keepValueOnRefresh">Keep Value on Refresh</mat-checkbox>
                      <mat-checkbox formControlName="keepErrorOnRefresh">Keep Error on Refresh</mat-checkbox>
                    </div>

                    <div class="form-section">
                      <h3>Suspense Configuration</h3>
                      <mat-form-field>
                        <mat-label>Suspense Threshold (ms)</mat-label>
                        <input matInput type="number" formControlName="suspenseThresholdMs" />
                      </mat-form-field>
                      <mat-form-field>
                        <mat-label>Suspense Time (ms)</mat-label>
                        <input matInput type="number" formControlName="suspenseTimeMs" />
                      </mat-form-field>
                    </div>
                  </form>
                </mat-card-content>
                }

                @case ('api') {
                <mat-card-header>
                  <mat-card-title>API Simulation</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="configForm" class="config-form">
                    <div class="form-section">
                      <h3>API Behavior</h3>
                      <mat-form-field>
                        <mat-label>API Delay (ms)</mat-label>
                        <input matInput type="number" formControlName="apiDelay" />
                      </mat-form-field>
                      <mat-checkbox formControlName="simulateError">Simulate API Errors</mat-checkbox>
                      <mat-checkbox formControlName="useErrorMapping">Use Custom Error Mapping</mat-checkbox>
                    </div>
                  </form>
                </mat-card-content>
                }

                @case ('refetch') {
                <mat-card-header>
                  <mat-card-title>Refetch Strategies</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <form [formGroup]="configForm" class="config-form">
                    <div class="form-section">
                      <h3>Manual Refetch</h3>
                      <mat-checkbox formControlName="enableManualRefetch">Enable Manual Refetch Trigger</mat-checkbox>
                    </div>

                    <div class="form-section">
                      <h3>Auto Refetch</h3>
                      <mat-checkbox formControlName="enableAutoRefetch">Enable Auto Refetch</mat-checkbox>

                      @if (configForm.get('enableAutoRefetch')?.value) {
                      <div class="nested-config">
                        <mat-form-field>
                          <mat-label>Auto Refetch Interval (ms)</mat-label>
                          <input matInput type="number" formControlName="autoRefetchInterval" />
                        </mat-form-field>
                        <mat-form-field>
                          <mat-label>Auto Refetch Duration (ms)</mat-label>
                          <input matInput type="number" formControlName="autoRefetchDuration" />
                        </mat-form-field>
                      </div>
                      }
                    </div>
                  </form>
                </mat-card-content>
                }

                @case ('code') {
                <mat-card-header>
                  <mat-card-title>Generated Code</mat-card-title>
                  <mat-card-subtitle>Copy this code to use the current configuration</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <pre><code [highlight]="generatedCode$ | async" language="typescript"></code></pre>
                </mat-card-content>
                }
              }
            </mat-card>

            <!-- Sticky Live Demo Panel -->
            <mat-card class="demo-panel">
              <mat-card-header>
                <mat-card-title>Live Demo</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <!-- Controls -->
                <div class="demo-controls">
                  @if (configForm.get('enableManualRefetch')?.value) {
                  <button mat-raised-button color="primary" (click)="manualTrigger$$.next()">Manual Refresh</button>
                  } @if (configForm.get('requestType')?.value === 'triggered') {
                  <button mat-raised-button color="accent" (click)="triggerRequest()">
                    Trigger Request (#{{ requestCounter }})
                  </button>
                  }

                  <button mat-raised-button (click)="reset()">Reset</button>
                </div>

                <!-- State Display -->
                <div class="state-display">
                  @if (dynamicRequest$ | async; as state) {
                  <div class="state-info">
                    <div class="state-badges">
                      <span class="badge" [class.active]="state.isSuspense">Loading: {{ state.isSuspense }}</span>
                      <span class="badge" [class.active]="state.hasValue">Has Value: {{ state.hasValue }}</span>
                      <span class="badge" [class.active]="state.hasError">Has Error: {{ state.hasError }}</span>
                      <span class="badge">Context: {{ state.context }}</span>
                    </div>

                    @if (state.isSuspense) {
                    <div class="loading-indicator">
                      <mat-spinner diameter="30"></mat-spinner>
                      <span>Loading...</span>
                    </div>
                    } @if (state.hasValue) {
                    <div class="value-display">
                      <h4>Value:</h4>
                      @if (state.value; as todos) {
                      <mat-list>
                        @for (todo of todos.slice(0, 5); track todo.id) {
                        <mat-list-item>
                          <todo-item [todo]="todo" />
                        </mat-list-item>
                        }
                      </mat-list>
                      @if (todos.length > 5) {
                      <p>... and {{ todos.length - 5 }} more todos</p>
                      } }
                    </div>
                    } @if (state.hasError) {
                    <div class="error-display">
                      <h4>Error:</h4>
                      <pre>{{ state.error }}</pre>
                    </div>
                    }
                  </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .sidebar-container {
        margin-top: 20px;
      }

      .sidenav-container {
        height: 80vh;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }

      .sidebar {
        width: 250px;
        background-color: #fafafa;
        border-right: 1px solid #e0e0e0;
      }

      .sidebar mat-list-item {
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .sidebar mat-list-item:hover {
        background-color: #f0f0f0;
      }

      .sidebar mat-list-item.active {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      .sidebar mat-list-item.active mat-icon {
        color: #1976d2;
      }

      .main-content {
        padding: 0;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1fr 400px;
        height: 100%;
      }

      .config-section {
        margin: 0;
        border-radius: 0;
        border-right: 1px solid #e0e0e0;
        height: 100%;
        overflow-y: auto;
      }

      .demo-panel {
        margin: 0;
        border-radius: 0;
        height: 100%;
        position: sticky;
        top: 0;
      }

      .config-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-section {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
      }

      .form-section h3 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 500;
        color: #424242;
      }

      .nested-config {
        margin-top: 12px;
        padding-left: 16px;
        border-left: 2px solid #e0e0e0;
      }

      .demo-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .demo-controls button {
        font-size: 12px;
        padding: 8px 12px;
      }

      .state-display {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 12px;
        min-height: 300px;
        font-size: 14px;
      }

      .state-badges {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .badge {
        padding: 3px 6px;
        border-radius: 3px;
        background-color: #f5f5f5;
        font-size: 11px;
        border: 1px solid #e0e0e0;
      }

      .badge.active {
        background-color: #e3f2fd;
        border-color: #2196f3;
        color: #1976d2;
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0;
      }

      .value-display,
      .error-display {
        margin-top: 12px;
        font-size: 13px;
      }

      .error-display {
        color: #d32f2f;
      }

      .error-display pre {
        background-color: #ffebee;
        padding: 8px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 12px;
      }

      mat-form-field {
        width: 100%;
        margin-bottom: 8px;
      }

      mat-checkbox {
        margin-bottom: 8px;
        display: block;
      }

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      pre code {
        font-size: 12px;
        line-height: 1.4;
      }
    `,
  ],
})
export class DemoAllInOneSidebarComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);

  // Current active section
  activeSection = 'request';

  // Triggers for different functionalities
  manualTrigger$$ = new Subject<void>();
  requestTrigger$$ = new Subject<number>();
  requestCounter = 1;

  // Configuration form
  configForm: FormGroup = this.fb.group({
    requestType: ['simple'],
    operator: ['switch'],
    keepValueOnRefresh: [false],
    keepErrorOnRefresh: [false],
    suspenseThresholdMs: [0],
    suspenseTimeMs: [0],
    apiDelay: [1000],
    simulateError: [false],
    useErrorMapping: [false],
    enableManualRefetch: [true],
    enableAutoRefetch: [false],
    autoRefetchInterval: [5000],
    autoRefetchDuration: [30000],
  });

  // Dynamic rxRequest based on configuration
  dynamicRequest$ = combineLatest([this.configForm.valueChanges.pipe(startWith(this.configForm.value))]).pipe(
    map(([config]) => {
      const refetchStrategies = [];

      if (config.enableManualRefetch) {
        refetchStrategies.push(withRefetchOnTrigger(this.manualTrigger$$));
      }

      if (config.enableAutoRefetch) {
        refetchStrategies.push(withAutoRefetch(config.autoRefetchInterval, config.autoRefetchDuration));
      }

      const requestConfig = {
        operator: config.operator,
        keepValueOnRefresh: config.keepValueOnRefresh,
        keepErrorOnRefresh: config.keepErrorOnRefresh,
        suspenseThresholdMs: config.suspenseThresholdMs,
        suspenseTimeMs: config.suspenseTimeMs,
        refetchStrategies,
        errorMappingFn: config.useErrorMapping
          ? (error: HttpErrorResponse) => `Custom Error: ${error.message || error.toString()}`
          : undefined,
        beforeHandleErrorFn: (error: any) => console.warn('Error occurred:', error),
        injector: this.injector,
      };

      if (config.requestType === 'triggered') {
        return rxRequest({
          trigger: this.requestTrigger$$,
          requestFn: (counter: number) => this.makeApiCall(counter, config.apiDelay, config.simulateError),
          config: requestConfig,
        });
      } else {
        return rxRequest({
          requestFn: () => this.makeApiCall(0, config.apiDelay, config.simulateError),
          config: requestConfig,
        });
      }
    }),
    switchMap((request) => request.value$())
  );

  // Generated code based on current configuration
  generatedCode$ = this.configForm.valueChanges.pipe(
    startWith(this.configForm.value),
    map((config) => this.generateCode(config))
  );

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  private makeApiCall(counter: number, delay: number, simulateError: boolean) {
    const baseUrl = 'https://jsonplaceholder.typicode.com/todos';
    const url = counter > 0 ? `${baseUrl}?_start=${counter * 5}&_limit=10` : `${baseUrl}?_limit=10`;

    return timer(delay).pipe(
      switchMap(() => {
        if (simulateError && Math.random() > 0.7) {
          return throwError(() => new Error(`Simulated API error for request ${counter || 'initial'}`));
        }
        return this.http.get<Todo[]>(url);
      })
    );
  }

  private generateCode(config: any): string {
    const refetchStrategies = [];

    if (config.enableManualRefetch) {
      refetchStrategies.push('withRefetchOnTrigger(this.manualTrigger$$)');
    }

    if (config.enableAutoRefetch) {
      refetchStrategies.push(`withAutoRefetch(${config.autoRefetchInterval}, ${config.autoRefetchDuration})`);
    }

    const configOptions = [];

    if (config.requestType === 'triggered') {
      configOptions.push(`operator: '${config.operator}'`);
    }

    configOptions.push(`keepValueOnRefresh: ${config.keepValueOnRefresh}`);
    configOptions.push(`keepErrorOnRefresh: ${config.keepErrorOnRefresh}`);
    configOptions.push(`suspenseThresholdMs: ${config.suspenseThresholdMs}`);
    configOptions.push(`suspenseTimeMs: ${config.suspenseTimeMs}`);

    if (refetchStrategies.length > 0) {
      configOptions.push(`refetchStrategies: [${refetchStrategies.join(', ')}]`);
    }

    if (config.useErrorMapping) {
      configOptions.push('errorMappingFn: (error: HttpErrorResponse) => `Custom Error: ${error.message}`');
    }

    const requestFnContent =
      config.requestType === 'triggered'
        ? `(counter: number) => this.http.get<Todo[]>(\`https://jsonplaceholder.typicode.com/todos?_start=\${counter * 5}&_limit=10\`)`
        : `() => this.http.get<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=10')`;

    const baseCode =
      config.requestType === 'triggered'
        ? `// Trigger for requests
readonly requestTrigger$$ = new Subject<number>();
let requestCounter = 1;

// Manual refresh trigger (if enabled)
${config.enableManualRefetch ? 'readonly manualTrigger$$ = new Subject<void>();' : '// No manual trigger'}

request = rxRequest({
  trigger: this.requestTrigger$$,
  requestFn: ${requestFnContent},
  config: {
    ${configOptions.join(',\n    ')}
  }
});

// Usage:
// Trigger new request: this.requestTrigger$$.next(this.requestCounter++);
${config.enableManualRefetch ? '// Manual refresh: this.manualTrigger$$.next();' : ''}`
        : `// Manual refresh trigger (if enabled)
${config.enableManualRefetch ? 'readonly manualTrigger$$ = new Subject<void>();' : '// No manual trigger'}

request = rxRequest({
  requestFn: ${requestFnContent},
  config: {
    ${configOptions.join(',\n    ')}
  }
});

// Usage:
${
  config.enableManualRefetch
    ? '// Manual refresh: this.manualTrigger$$.next();'
    : '// Call request.refresh() to manually refresh'
}`;

    return baseCode;
  }

  triggerRequest() {
    this.requestTrigger$$.next(this.requestCounter++);
  }

  reset() {
    this.requestCounter = 1;
    this.configForm.reset({
      requestType: 'simple',
      operator: 'switch',
      keepValueOnRefresh: false,
      keepErrorOnRefresh: false,
      suspenseThresholdMs: 0,
      suspenseTimeMs: 0,
      apiDelay: 1000,
      simulateError: false,
      useErrorMapping: false,
      enableManualRefetch: true,
      enableAutoRefetch: false,
      autoRefetchInterval: 5000,
      autoRefetchDuration: 30000,
    });
  }
}