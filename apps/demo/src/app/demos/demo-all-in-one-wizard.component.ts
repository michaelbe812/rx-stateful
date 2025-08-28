import { Component, inject, Injector, ViewChild } from '@angular/core';
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
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { HighlightModule } from 'ngx-highlightjs';
import { combineLatest, map, startWith, Subject, switchMap, throwError, timer } from 'rxjs';
import { rxRequest, withAutoRefetch, withRefetchOnTrigger } from '@angular-kit/rx-stateful';
import { Todo } from '../types';
import { TodoItemComponent } from './todo-item.component';

@Component({
  selector: 'demo-all-in-one-wizard',
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
    MatStepperModule,
    MatIconModule,
    HighlightModule,
    TodoItemComponent,
  ],
  template: `
    <h1>All-in-One rxRequest Demo - Wizard Layout</h1>
    <p>Step through rxRequest configuration using a guided wizard. Same features as the original demo with a step-by-step approach.</p>

    <mat-card class="wizard-container">
      <mat-card-content>
        <mat-stepper #stepper linear="false" orientation="horizontal">
          <!-- Step 1: Request Configuration -->
          <mat-step>
            <ng-template matStepLabel>Request Setup</ng-template>
            <div class="step-content">
              <h3>Configure Request Type and Operator</h3>
              <form [formGroup]="configForm" class="config-form">
                <div class="form-section">
                  <h4>Request Type</h4>
                  <mat-radio-group formControlName="requestType">
                    <mat-radio-button value="simple">Simple Request (no trigger)</mat-radio-button>
                    <mat-radio-button value="triggered">Triggered Request</mat-radio-button>
                  </mat-radio-group>
                </div>

                @if (configForm.get('requestType')?.value === 'triggered') {
                <div class="form-section">
                  <h4>Operator</h4>
                  <mat-select formControlName="operator" placeholder="Choose operator">
                    <mat-option value="switch">switch - Cancel previous requests</mat-option>
                    <mat-option value="merge">merge - Allow concurrent requests</mat-option>
                    <mat-option value="concat">concat - Queue requests sequentially</mat-option>
                    <mat-option value="exhaust">exhaust - Ignore new triggers while running</mat-option>
                  </mat-select>
                </div>
                }

                <!-- Step Summary -->
                <div class="step-summary">
                  <strong>Current Configuration:</strong>
                  <ul>
                    <li>Request Type: {{ configForm.get('requestType')?.value === 'simple' ? 'Simple (immediate execution)' : 'Triggered (manual control)' }}</li>
                    @if (configForm.get('requestType')?.value === 'triggered') {
                    <li>Operator: {{ configForm.get('operator')?.value || 'Not selected' }}</li>
                    }
                  </ul>
                </div>
              </form>
              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext>Next</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 2: State Management -->
          <mat-step>
            <ng-template matStepLabel>State Management</ng-template>
            <div class="step-content">
              <h3>Configure State Persistence and Suspense</h3>
              <form [formGroup]="configForm" class="config-form">
                <div class="form-section">
                  <h4>Value & Error Persistence</h4>
                  <mat-checkbox formControlName="keepValueOnRefresh">
                    Keep Value on Refresh
                    <span class="hint">Preserve last successful value when refreshing</span>
                  </mat-checkbox>
                  <mat-checkbox formControlName="keepErrorOnRefresh">
                    Keep Error on Refresh
                    <span class="hint">Preserve error state when refreshing</span>
                  </mat-checkbox>
                </div>

                <div class="form-section">
                  <h4>Suspense Configuration</h4>
                  <mat-form-field>
                    <mat-label>Suspense Threshold (ms)</mat-label>
                    <input matInput type="number" formControlName="suspenseThresholdMs" />
                    <mat-hint>Minimum time before showing loading state</mat-hint>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Suspense Time (ms)</mat-label>
                    <input matInput type="number" formControlName="suspenseTimeMs" />
                    <mat-hint>Maximum time to wait before giving up</mat-hint>
                  </mat-form-field>
                </div>

                <!-- Step Summary -->
                <div class="step-summary">
                  <strong>State Settings:</strong>
                  <ul>
                    <li>Keep Value: {{ configForm.get('keepValueOnRefresh')?.value ? 'Yes' : 'No' }}</li>
                    <li>Keep Error: {{ configForm.get('keepErrorOnRefresh')?.value ? 'Yes' : 'No' }}</li>
                    <li>Suspense Threshold: {{ configForm.get('suspenseThresholdMs')?.value }}ms</li>
                    <li>Suspense Time: {{ configForm.get('suspenseTimeMs')?.value }}ms</li>
                  </ul>
                </div>
              </form>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext>Next</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 3: API Settings -->
          <mat-step>
            <ng-template matStepLabel>API Simulation</ng-template>
            <div class="step-content">
              <h3>Configure API Behavior and Error Handling</h3>
              <form [formGroup]="configForm" class="config-form">
                <div class="form-section">
                  <h4>API Behavior</h4>
                  <mat-form-field>
                    <mat-label>API Delay (ms)</mat-label>
                    <input matInput type="number" formControlName="apiDelay" />
                    <mat-hint>Simulate network latency</mat-hint>
                  </mat-form-field>
                  <mat-checkbox formControlName="simulateError">
                    Simulate API Errors
                    <span class="hint">Randomly fail 30% of requests for testing</span>
                  </mat-checkbox>
                  <mat-checkbox formControlName="useErrorMapping">
                    Use Custom Error Mapping
                    <span class="hint">Transform errors before displaying</span>
                  </mat-checkbox>
                </div>

                <!-- Step Summary -->
                <div class="step-summary">
                  <strong>API Settings:</strong>
                  <ul>
                    <li>Delay: {{ configForm.get('apiDelay')?.value }}ms</li>
                    <li>Error Simulation: {{ configForm.get('simulateError')?.value ? 'Enabled' : 'Disabled' }}</li>
                    <li>Error Mapping: {{ configForm.get('useErrorMapping')?.value ? 'Custom' : 'Default' }}</li>
                  </ul>
                </div>
              </form>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext>Next</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 4: Refetch Strategies -->
          <mat-step>
            <ng-template matStepLabel>Refetch Setup</ng-template>
            <div class="step-content">
              <h3>Configure Refresh and Refetch Behavior</h3>
              <form [formGroup]="configForm" class="config-form">
                <div class="form-section">
                  <h4>Manual Refetch</h4>
                  <mat-checkbox formControlName="enableManualRefetch">
                    Enable Manual Refetch Trigger
                    <span class="hint">Allow manual refresh via trigger Subject</span>
                  </mat-checkbox>
                </div>

                <div class="form-section">
                  <h4>Auto Refetch</h4>
                  <mat-checkbox formControlName="enableAutoRefetch">
                    Enable Auto Refetch
                    <span class="hint">Automatically refresh data at intervals</span>
                  </mat-checkbox>

                  @if (configForm.get('enableAutoRefetch')?.value) {
                  <div class="nested-config">
                    <mat-form-field>
                      <mat-label>Auto Refetch Interval (ms)</mat-label>
                      <input matInput type="number" formControlName="autoRefetchInterval" />
                      <mat-hint>How often to refresh</mat-hint>
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Auto Refetch Duration (ms)</mat-label>
                      <input matInput type="number" formControlName="autoRefetchDuration" />
                      <mat-hint>How long to keep refreshing</mat-hint>
                    </mat-form-field>
                  </div>
                  }
                </div>

                <!-- Step Summary -->
                <div class="step-summary">
                  <strong>Refetch Settings:</strong>
                  <ul>
                    <li>Manual Refetch: {{ configForm.get('enableManualRefetch')?.value ? 'Enabled' : 'Disabled' }}</li>
                    <li>Auto Refetch: {{ configForm.get('enableAutoRefetch')?.value ? 'Enabled' : 'Disabled' }}</li>
                    @if (configForm.get('enableAutoRefetch')?.value) {
                    <li>Interval: {{ configForm.get('autoRefetchInterval')?.value }}ms</li>
                    <li>Duration: {{ configForm.get('autoRefetchDuration')?.value }}ms</li>
                    }
                  </ul>
                </div>
              </form>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext>See Results</button>
              </div>
            </div>
          </mat-step>

          <!-- Step 5: Live Demo & Results -->
          <mat-step>
            <ng-template matStepLabel>Live Demo</ng-template>
            <div class="step-content">
              <h3>Test Your Configuration</h3>
              <div class="demo-grid">
                <!-- Live Demo Panel -->
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

                      <button mat-raised-button (click)="reset(); stepper.reset()">Reset All</button>
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
                            @for (todo of todos.slice(0, 3); track todo.id) {
                            <mat-list-item>
                              <todo-item [todo]="todo" />
                            </mat-list-item>
                            }
                          </mat-list>
                          @if (todos.length > 3) {
                          <p>... and {{ todos.length - 3 }} more todos</p>
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

                <!-- Generated Code Panel -->
                <mat-card class="code-panel">
                  <mat-card-header>
                    <mat-card-title>Generated Code</mat-card-title>
                    <mat-card-subtitle>Copy this code to use your configuration</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <pre><code [highlight]="generatedCode$ | async" language="typescript"></code></pre>
                  </mat-card-content>
                </mat-card>
              </div>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" (click)="stepper.reset()">Start Over</button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .wizard-container {
        margin-top: 20px;
      }

      .step-content {
        padding: 20px;
        min-height: 400px;
      }

      .step-content h3 {
        margin: 0 0 20px 0;
        color: #424242;
      }

      .config-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-section {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
      }

      .form-section h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
        color: #424242;
      }

      .nested-config {
        margin-top: 12px;
        padding-left: 16px;
        border-left: 2px solid #e0e0e0;
      }

      .step-summary {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 16px;
        margin-top: 20px;
      }

      .step-summary ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
      }

      .step-summary li {
        margin-bottom: 4px;
      }

      .step-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
        justify-content: flex-end;
      }

      .demo-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .demo-panel,
      .code-panel {
        height: fit-content;
      }

      .demo-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
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

      .hint {
        display: block;
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }

      mat-form-field {
        width: 100%;
        margin-bottom: 8px;
      }

      mat-checkbox {
        margin-bottom: 12px;
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

      mat-stepper {
        background: transparent;
      }
    `,
  ],
})
export class DemoAllInOneWizardComponent {
  @ViewChild('stepper') stepper!: MatStepper;

  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);

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