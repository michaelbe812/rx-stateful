import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../../migrations.json');

describe('migrate-refreshtrigger', () => {
  let tree: Tree;
  let runner: SchematicTestRunner;

  beforeEach(() => {
    tree = Tree.empty();
    runner = new SchematicTestRunner('test', collectionPath);
  });

  it('should migrate simple refreshTrigger to withRefetchOnTrigger and add import', async () => {
    tree.create(
      '/test.ts',
      `rxStateful$(source$, { refreshTrigger$: trigger$ })`
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';\nrxStateful$(source$, { refetchStrategies: [withRefetchOnTrigger(trigger$)] })`
    );
  });

  it('should preserve existing refetchStrategies and add import', async () => {
    tree.create(
      '/test.ts',
      `rxStateful$(source$, { refreshTrigger$: trigger$, refetchStrategies: [existingStrategy] })`
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';\nrxStateful$(source$, { refetchStrategies: [existingStrategy, withRefetchOnTrigger(trigger$)] })`
    );
  });

  it('should append to existing imports from @angular-kit/rx-stateful', async () => {
    tree.create(
      '/test.ts',
      `import { someOtherThing } from '@angular-kit/rx-stateful';\nrxStateful$(source$, { refreshTrigger$: trigger$ })`
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `import { someOtherThing, withRefetchOnTrigger } from '@angular-kit/rx-stateful';\nrxStateful$(source$, { refetchStrategies: [withRefetchOnTrigger(trigger$)] })`
    );
  });

  it('should not modify files without refreshTrigger', async () => {
    const originalContent = `rxStateful$(source$, { someOtherOption: true })`;
    tree.create('/test.ts', originalContent);

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(originalContent);
  });

  it('should handle multiple occurrences in the same file', async () => {
    tree.create(
      '/test.ts',
      `
      rxStateful$(source1$, { refreshTrigger$: trigger1$ });
      rxStateful$(source2$, { refreshTrigger$: trigger2$ });
      `
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toContain(`import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';`);
    expect(content).toContain('rxStateful$(source1$, { refetchStrategies: [withRefetchOnTrigger(trigger1$)] })');
    expect(content).toContain('rxStateful$(source2$, { refetchStrategies: [withRefetchOnTrigger(trigger2$)] })');
  });

  it('should not duplicate withRefetchOnTrigger import if already present', async () => {
    tree.create(
      '/test.ts',
      `import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';\nrxStateful$(source$, { refreshTrigger$: trigger$ })`
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';\nrxStateful$(source$, { refetchStrategies: [withRefetchOnTrigger(trigger$)] })`
    );
  });
});
