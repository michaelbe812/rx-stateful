# @angular-kit/rx-stateful

A powerful RxJS-based state management library for Angular that wraps async Observables and provides a
stateful stream. It offers out of the box:

- 🔄 loading state
- ❌ automatic error handling
- 🔄 refresh-mechanisms
- 🔴 multicasted stream
- ⚙️ powerful configuration possibilities e.g. to keep the last value on refresh
- ⚡️ non-flickering loading state for great UX

> [!IMPORTANT] > **Breaking Change**: The `rxStateful$` function has been removed. Please use `rxRequest` which provides the same functionality with an improved API.

## Installation

```bash

npm install @angular-kit/rx-stateful
yarn add @angular-kit/rx-stateful
pnpm add @angular-kit/rx-stateful

```

## Demo

A live demo is available on [here](https://salmon-river-0283bb503.4.azurestaticapps.net)

## Usage

### `rxRequest` - The main API

#### Basic Usage

```typescript
import { rxRequest } from '@angular-kit/rx-stateful';
import { from } from 'rxjs';

// Simple request without trigger
const request = rxRequest({
  requestFn: () => from(fetch('https://api.example.com/data')),
  config: {
    keepValueOnRefresh: true,
    suspenseThresholdMs: 500,
    suspenseTimeMs: 500,
  },
});

// Access the state stream
const state$ = request.value$();
/**
 * Will emit states like:
 * { value: null, hasValue: false, context: 'suspense', hasError: false, error: undefined }
 * { value: DATA, hasValue: true, context: 'next', hasError: false, error: undefined }
 */

// Trigger a refresh
request.refresh();
```

#### Usage with Trigger

```typescript
import { rxRequest, withRefetchOnTrigger } from '@angular-kit/rx-stateful';
import { Subject } from 'rxjs';

const searchTerm$ = new Subject<string>();
const refreshTrigger$ = new Subject<void>();

const searchRequest = rxRequest({
  trigger: searchTerm$,
  requestFn: (term: string) => from(fetch(`/api/search?q=${term}`)),
  config: {
    keepValueOnRefresh: false,
    refetchStrategies: withRefetchOnTrigger(refreshTrigger$),
  },
});

// This will trigger the request whenever searchTerm$ emits
searchTerm$.next('angular');

// This will refresh the last search
refreshTrigger$.next();
```

### API

`rxRequest.value$()` returns an Observable with the following properties:

- `value` - the value
- `hasValue` - boolean if a value is present
- `context` - the context of the stream ('suspense', 'next', 'error')
- `hasError` - boolean if an error is present
- `error` - the error, if present
- `isSuspense` - suspense/loading state

`rxRequest.refresh()` offers a convenient way to trigger a refresh of the source. It will trigger the source again and emit the new states.

### Configuration of `rxRequest`

`rxRequest` provides configuration possibility on instance level or globally.

#### Global configuration

You can provide a global configuration for `rxRequest`. This configuration will be used for every instance of `rxRequest`.

Use `provideRxStatefulConfig` in either your `AppModule` or `appConfig` to provide a global configuration.

#### Configuration on instance level

You can also provide a configuration on instance level. This will also override the global configuration (if present).

- `keepValueOnRefresh` - boolean if the value should be kept when the `refreshTrigger$` emits. Default: `false`
- `keepErrorOnRefresh` - boolean if thel last error should be kept when the `refreshTrigger$` emits. Default: `false`
- `refreshTrigger$` - a Subject or Observable that triggers the source again. Default: not set. _deprecated_ use `refetchStrategies`
- `refetchStrategies` - single or multiple `RefetchStrategies` to trigger the source again. Default: not set
- `suspenseThresholdMs` - number of milliseconds to wait before emitting the suspense state. Default: 0
- `suspenseTimeMs` - number of milliseconds to wait before the next state after the suspense state. Default: 0

> [!TIP]
> A few more words about the `suspenseThresholdMs` and `suspenseTimeMs` configuration. This is a quite powerful feature which will
> result in a better UX when preventing flickering loading states. What does flickering loading states mean? When you show a loading indicator/spinner based on the
> `isSuspense`-property then a common scenario is that you show a spinner for a very short tim for fast requests resulting in some flickering. To prevent this it is better to
> wait a certain amount of time before showing a spinner (suspenseThreshold). If then the request takes longer thant the threshold-time a spinner will be shown for at least another amount of time
> (suspenseTime). That way you can prevent flickering spinners.
>
> `rxStateful$` provides exactly this feature and will only emit the suspense-state if a async-operation takes longer than the specified `suspenseThresholdMs` for at least `suspenseTimeMs`.
> A reasonable configuration of these two values would be to set them both to 500ms.

> [!IMPORTANT]
> The default value for `suspenseThresholdMs` and `suspenseTimeMs` is 0, therefor by default you will not use the non-flickering loading state feature.
> It is choosen that way to break existing behavior. This might change in a future major version.

##### Configuration Example

```typescript
import { rxRequest } from '@angular-kit/rx-stateful';

const request = rxRequest({ requestFn: () => someSource$, config: { keepValueOnRefresh: true } });
```

##### `refetchStrategies`

- `withRefetchOnTrigger`
- `withAutoRefetch`

### Usage via `RxStatefulClient`

> [!CAUTION]
> The `RxStatefulClient` is a experimental feature. Breaking changes might occur in any version update.

In order to use `RxStatefulClient` you first need to provide it, e.g. in your `AppModule`:

```typescript
import { provideRxStatefulClient } from '@angular-kit/rx-stateful';

@NgModule({
  providers: [provideRxStatefulClient()],
})
export class AppModule {}
```

`RxStatefulClient` offers a `request`-method which basically has the same signature as `rxStateful$` - so there'is no
difference in usage.

#### Global configuration

`provideRxStatefulClient()` can be configured:

```typescript
import { provideRxStatefulClient, withConfig } from '@angular-kit/rx-stateful';

@NgModule({
  providers: [provideRxStatefulClient(withConfig({ keepValueOnRefresh: true }))],
})
export class AppModule {}
```

The global configuration will be used for every `request`-call. You can still override the global configuration by
providing a configuration object as second parameter to `request`-method.

## Configuring refresh behaviour

Both `rxRequest` and `RxStatefulClient` can be configured to refresh the source (e.g. make a HTTP call again).

To define the refresh behaviour you can make use of so called `RefetchStrategy`'s. Right now there are following strategies
built in: `withAutoRefetch` and `withRefetchOnTrigger`.

### Usage on `rxRequest`

```typescript
const request = rxRequest({
  requestFn: () => fetch(),
  config: { refetchStrategies: [withAutoRefetch(1000, Infinity)] },
});
```

### Usage on `RxStatefulClient`

```typescript
const client = inject(RxStatefulClient);
const instance = client.request(fetch(), { refetchStrategy: [withAutoRefetch(1000, Infinity)] });
```

All strategies can be cominded in an arbitrary way.

In the future there will come more strategies built in, as well as an easy way to define custom strategies. However defining
custom strategies is already possible by implementing the `RefetchStrategy` interface.

## Testing

Please have a look at the [testing documentation](./testing/README.md).

## Versioning

This project follows [Semantic Versioning](https://semver.org/).

## Angular Compatibility

- Version `2.x.x` requires Angular >=18.0.0
- Version `1.x.x` requires Angular >=14.0.0

## License

MIT

## Contributing

Any Contributions are welcome. Please open up an issue or create PR if you would like to contribute.

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
