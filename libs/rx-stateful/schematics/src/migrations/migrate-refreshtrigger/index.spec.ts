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

  it('should migrate simple refreshTrigger to withRefetchOnTrigger', async () => {
    tree.create(
      '/test.ts',
      `rxStateful$(source$, { refreshTrigger$: trigger$ })`
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `rxStatefulRequest(source$, {refetchStrategies: [withRefetchOnTrigger(trigger$)]})`
    );
  });

  it('should preserve existing refetchStrategies', async () => {
    tree.create(
      '/test.ts',
      `rxStateful$(source$, { refreshTrigger$: trigger$, refetchStrategies: [existingStrategy] })`
    );

    const newTree = await runner.runSchematic('migrate-refresh-trigger', {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toBe(
      `rxStateful$(source$, { refetchStrategies: [existingStrategy, withRefetchOnTrigger(trigger$)] })`
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

    expect(content).toContain('rxStatefulRequest(source1$, {refetchStrategies: [withRefetchOnTrigger(trigger1$)]})');
    expect(content).toContain('rxStatefulRequest(source2$, {refetchStrategies: [withRefetchOnTrigger(trigger2$)]})');
  });
});
