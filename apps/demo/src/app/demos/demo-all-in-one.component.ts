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
import { HighlightModule } from 'ngx-highlightjs';
import { BehaviorSubject, combineLatest, map, scan, startWith, Subject, switchMap, throwError, timer } from 'rxjs';
import { rxRequest, withAutoRefetch, withRefetchOnTrigger } from '@angular-kit/rx-stateful';
import { Todo } from '../types';
import { TodoItemComponent } from './todo-item.component';

@Component({
  selector: 'demo-all-in-one',
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
    HighlightModule,
    TodoItemComponent,
  ],
  template: `
    <h1>All-in-One rxRequest Demo</h1>
    <p>Configure all rxRequest behaviors and see them in action with live code generation.</p>

    <div class="demo-container">
      <!-- Configuration Panel -->
      <mat-card class="config-panel">
        <mat-card-header>
          <mat-card-title>Configuration</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="configForm" class="config-form">
            <!-- Request Type -->
            <div class="form-section">
              <h3>Request Type</h3>
              <mat-radio-group formControlName="requestType">
                <mat-radio-button value="simple">Simple Request (no trigger)</mat-radio-button>
                <mat-radio-button value="triggered">Triggered Request</mat-radio-button>
              </mat-radio-group>
            </div>

            <!-- Operator Selection -->
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

            <!-- State Management -->
            <div class="form-section">
              <h3>State Management</h3>
              <mat-checkbox formControlName="keepValueOnRefresh">Keep Value on Refresh</mat-checkbox>
              <mat-checkbox formControlName="keepErrorOnRefresh">Keep Error on Refresh</mat-checkbox>
            </div>

            <!-- Suspense Configuration -->
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

            <!-- API Simulation -->
            <div class="form-section">
              <h3>API Simulation</h3>
              <mat-form-field>
                <mat-label>API Delay (ms)</mat-label>
                <input matInput type="number" formControlName="apiDelay" />
              </mat-form-field>
              <mat-checkbox formControlName="simulateError">Simulate API Errors</mat-checkbox>
              <mat-checkbox formControlName="useErrorMapping">Use Custom Error Mapping</mat-checkbox>
            </div>

            <!-- Pagination -->
            <div class="form-section">
              <h3>Pagination</h3>
              <mat-checkbox formControlName="enablePagination">Enable Pagination</mat-checkbox>
              @if (configForm.get('enablePagination')?.value) {
              <div class="nested-config">
                <mat-form-field>
                  <mat-label>Items per page</mat-label>
                  <input matInput type="number" formControlName="itemsPerPage" />
                </mat-form-field>
              </div>
              }
            </div>

            <!-- Refetch Strategies -->
            <div class="form-section">
              <h3>Refetch Strategies</h3>
              <mat-checkbox formControlName="enableManualRefetch">Manual Refetch Trigger</mat-checkbox>
              <mat-checkbox formControlName="enableAutoRefetch">Auto Refetch</mat-checkbox>

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
      </mat-card>

      <!-- Live Demo Panel -->
      <mat-card class="demo-panel">
        <mat-card-header>
          <mat-card-title>Live Demo</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Controls -->
          <div class="demo-controls">
            @if (configForm.get('enablePagination')?.value) {
            <button mat-raised-button (click)="previousPage()" [disabled]="currentPage === 0">Previous Page</button>
            <button mat-raised-button (click)="nextPage()">Next Page</button>
            <span class="page-indicator">Page {{ currentPage + 1 }}</span>
            }
            @if (configForm.get('enableManualRefetch')?.value) {
            <button mat-raised-button color="primary" (click)="manualTrigger$$.next()">Manual Refresh</button>
            } @if (configForm.get('requestType')?.value === 'triggered' && !configForm.get('enablePagination')?.value) {
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

    <!-- Generated Code Panel -->
    <mat-card class="code-panel">
      <mat-card-header>
        <mat-card-title>Generated Code</mat-card-title>
        <mat-card-subtitle>Copy this code to use the current configuration</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header> TypeScript Code </mat-expansion-panel-header>
          <pre><code [highlight]="generatedCode$ | async" language="typescript"></code></pre>
        </mat-expansion-panel>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .demo-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }

      .config-panel {
        height: fit-content;
      }

      .demo-panel {
        height: fit-content;
      }

      .code-panel {
        grid-column: 1 / -1;
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
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .state-display {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
        min-height: 200px;
      }

      .state-badges {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .badge {
        padding: 4px 8px;
        border-radius: 4px;
        background-color: #f5f5f5;
        font-size: 12px;
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
        gap: 12px;
        margin: 20px 0;
      }

      .value-display,
      .error-display {
        margin-top: 16px;
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
      }

      mat-form-field {
        width: 100%;
        margin-bottom: 8px;
      }

      mat-checkbox {
        margin-bottom: 8px;
      }

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .page-indicator {
        padding: 8px 16px;
        font-weight: 500;
      }
    `,
  ],
})
export class DemoAllInOneComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);

  // Triggers for different functionalities
  manualTrigger$$ = new Subject<void>();
  requestTrigger$$ = new Subject<number>();
  requestCounter = 1;
  
  // Pagination
  page$$ = new BehaviorSubject(0);
  currentPage = 0;
  page$ = this.page$$.pipe(
    scan((acc, curr) => {
      const newPage = Math.max(0, acc + curr);
      this.currentPage = newPage;
      return newPage;
    }, 0)
  );

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
    enablePagination: [false],
    itemsPerPage: [5],
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

      if (config.enablePagination) {
        return rxRequest({
          trigger: this.page$,
          requestFn: (page: number) => this.makeApiCallWithPagination(page, config.itemsPerPage, config.apiDelay, config.simulateError),
          config: requestConfig,
        });
      } else if (config.requestType === 'triggered') {
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

  private makeApiCallWithPagination(page: number, itemsPerPage: number, delay: number, simulateError: boolean) {
    const baseUrl = 'https://jsonplaceholder.typicode.com/todos';
    const url = `${baseUrl}?_start=${page * itemsPerPage}&_limit=${itemsPerPage}`;

    return timer(delay).pipe(
      switchMap(() => {
        if (simulateError && Math.random() > 0.7) {
          return throwError(() => new Error(`Simulated API error for page ${page}`));
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

    if (config.enablePagination || config.requestType === 'triggered') {
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

    if (config.enablePagination) {
      return `// Pagination state
readonly page$$ = new BehaviorSubject(0);
readonly page$ = this.page$$.pipe(
  scan((acc, curr) => Math.max(0, acc + curr), 0)
);

// Manual refresh trigger (if enabled)
${config.enableManualRefetch ? 'readonly manualTrigger$$ = new Subject<void>();' : '// No manual trigger'}

request = rxRequest({
  trigger: this.page$,
  requestFn: (page: number) => this.http.get<Todo[]>(\`https://jsonplaceholder.typicode.com/todos?_start=\${page * ${config.itemsPerPage}}&_limit=${config.itemsPerPage}\`),
  config: {
    ${configOptions.join(',\\n    ')}
  }
});

// Usage:
// Previous page: this.page$$.next(-1);
// Next page: this.page$$.next(1);
${config.enableManualRefetch ? '// Manual refresh: this.manualTrigger$$.next();' : ''}`;
    }

    const requestFnContent =
      config.requestType === 'triggered'
        ? `(counter: number) => this.http.get<Todo[]>(\`https://jsonplaceholder.typicode.com/todos?_start=\${counter * 5}&_limit=10\`)`
        : `() => this.http.get<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=10')`;

    return config.requestType === 'triggered'
      ? `// Trigger for requests
readonly requestTrigger$$ = new Subject<number>();
let requestCounter = 1;

// Manual refresh trigger (if enabled)
${config.enableManualRefresh ? 'readonly manualTrigger$$ = new Subject<void>();' : '// No manual trigger'}

request = rxRequest({
  trigger: this.requestTrigger$$,
  requestFn: ${requestFnContent},
  config: {
    ${configOptions.join(',\\n    ')}
  }
});

// Usage:
// Trigger new request: this.requestTrigger$$.next(this.requestCounter++);
${config.enableManualRefresh ? '// Manual refresh: this.manualTrigger$$.next();' : ''}`
      : `// Manual refresh trigger (if enabled)
${config.enableManualRefetch ? 'readonly manualTrigger$$ = new Subject<void>();' : '// No manual trigger'}

request = rxRequest({
  requestFn: ${requestFnContent},
  config: {
    ${configOptions.join(',\\n    ')}
  }
});

// Usage:
${
  config.enableManualRefetch
    ? '// Manual refresh: this.manualTrigger$$.next();'
    : '// Call request.refresh() to manually refresh'
}`;
  }

  triggerRequest() {
    this.requestTrigger$$.next(this.requestCounter++);
  }

  previousPage() {
    this.page$$.next(-1);
  }

  nextPage() {
    this.page$$.next(1);
  }

  reset() {
    this.requestCounter = 1;
    this.currentPage = 0;
    this.page$$ = new BehaviorSubject(0);
    this.page$ = this.page$$.pipe(
      scan((acc, curr) => Math.max(0, acc + curr), 0)
    );
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
      enablePagination: false,
      itemsPerPage: 5,
    });
  }
}
