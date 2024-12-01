import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../../collection.json');

describe('migrate-to-rx-stateful-request', () => {
  let tree: Tree;
  let runner: SchematicTestRunner;

  beforeEach(() => {
    tree = Tree.empty();
    runner = new SchematicTestRunner('test', collectionPath);
  });

  it('should migrate simple rxStateful$ declaration', async () => {
    tree.create(
      '/test.ts',
      `const state$ = rxStateful$(of(null));`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(`const state$ = rxStatefulRequest(of(null));`);
  });

  it('should migrate rxStateful$ with config', async () => {
    tree.create(
      '/test.ts',
      `const state$ = rxStateful$(of(null), { keepValueOnRefresh: true });`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(`const state$ = rxStatefulRequest(of(null), { keepValueOnRefresh: true });`);
  });

  it('should migrate rxStateful$ with source function', async () => {
    tree.create(
      '/test.ts',
      `const state$ = rxStateful$((arg: string) => of(arg), { sourceTriggerConfig: { trigger: trigger$ } });`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(`const state$ = rxStatefulRequest((arg: string) => of(arg), { sourceTriggerConfig: { trigger: trigger$ } });`);
  });

  it('should migrate derived value access', async () => {
    tree.create(
      '/test.ts',
      `const state$ = rxStateful$(of(null));
       const value$ = state$.pipe(map(v => v.value));`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `const state$ = rxStatefulRequest(of(null));
       const value$ = state$.value$().pipe(map(v => v.value));`
    );
  });

  it('should migrate class property declarations', async () => {
    tree.create(
      '/test.ts',
      `@Component({})
       class TestComponent {
         state$ = rxStateful$(of(null));
         value$ = this.state$.pipe(map(v => v.value));
       }`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `@Component({})
       class TestComponent {
         state$ = rxStatefulRequest(of(null));
         value$ = this.state$.value$().pipe(map(v => v.value));
       }`
    );
  });

  it('should migrate multiple rxStateful$ calls in the same file', async () => {
    tree.create(
      '/test.ts',
      `const state1$ = rxStateful$(of(1));
       const state2$ = rxStateful$(of(2));
       const value1$ = state1$.pipe(map(v => v.value));
       const value2$ = state2$.pipe(map(v => v.value));`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `const state1$ = rxStatefulRequest(of(1));
       const state2$ = rxStatefulRequest(of(2));
       const value1$ = state1$.value$().pipe(map(v => v.value));
       const value2$ = state2$.value$().pipe(map(v => v.value));`
    );
  });

  it('should handle rxStateful$ with complex pipe operations', async () => {
    tree.create(
      '/test.ts',
      `
      const value$ = state$.pipe(
        filter(s => !s.isLoading),
        map(v => v.value),
        distinctUntilChanged()
      );
      `
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(`
      const value$ = state$.value$().pipe(
        filter(s => !s.isLoading),
        map(v => v.value),
        distinctUntilChanged()
      );
      `);
  });

  it('should not modify non-rxStateful$ code', async () => {
    const originalContent = `
      const normalObs$ = of(null).pipe(map(x => x));
      const otherCode = someFunction();
    `;
    tree.create('/test.ts', originalContent);

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(originalContent);
  });

  it('should handle rxStateful$ with refreshTrigger', async () => {
    tree.create(
      '/test.ts',
      `const state$ = rxStateful$(of(null), { refreshTrigger$: trigger$ });`
    );

    const newTree = await runner.runSchematic('migrate-to-rx-stateful-request', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `const state$ = rxStatefulRequest(of(null), { refetchStrategies: [withRefetchOnTrigger(trigger$)] });`
    );
  });
});
