import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../../../collection.json');
const migrationName = 'migrate-to-rx-request';

describe('rxStateful-to-rxRequest', () => {
  let tree: Tree;
  let runner: SchematicTestRunner;

  beforeEach(() => {
    tree = Tree.empty();
    runner = new SchematicTestRunner('test', collectionPath);
  });

  it('should add rxRequest import when no imports exist', async () => {
    tree.create(
      '/test.ts',
      `stateful1 = rxStateful$(of('Hello'), {keepErrorOnRefresh: true})`
    );

    const newTree = await runner.runSchematic(migrationName, {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toMatch(/^import { rxRequest } from '@angular-kit\/rx-stateful';/);
  });

  it('should add rxRequest import after existing imports', async () => {
    tree.create(
      '/test.ts',
      `import { Component } from '@angular/core';\n\nstateful1 = rxStateful$(of('Hello'), {keepErrorOnRefresh: true})`
    );

    const newTree = await runner.runSchematic(migrationName, {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toContain(`import { Component } from '@angular/core';\nimport { rxRequest } from '@angular-kit/rx-stateful';`);
  });

  it('should merge rxRequest into existing @angular-kit/rx-stateful import', async () => {
    tree.create(
      '/test.ts',
      `import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';\n\nstateful1 = rxStateful$(of('Hello'), {keepErrorOnRefresh: true})`
    );

    const newTree = await runner.runSchematic(migrationName, {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toContain(`import { withRefetchOnTrigger, rxRequest } from '@angular-kit/rx-stateful';`);
    expect(content.match(/@angular-kit\/rx-stateful/g)?.length).toBe(1);
  });

  it('should not add duplicate rxRequest to existing import', async () => {
    tree.create(
      '/test.ts',
      `import { rxRequest } from '@angular-kit/rx-stateful';\n\nstateful1 = rxStateful$(of('Hello'), {keepErrorOnRefresh: true})`
    );

    const newTree = await runner.runSchematic(migrationName, {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content.match(/rxRequest/g)?.length).toBe(2); // One in import, one in usage
  });

  it('should handle multiple imports and empty lines correctly', async () => {
    tree.create(
      '/test.ts',
      `import { Component } from '@angular/core';\n\nimport { withRefetchOnTrigger } from '@angular-kit/rx-stateful';\n\nstateful1 = rxStateful$(of('Hello'), {keepErrorOnRefresh: true})`
    );

    const newTree = await runner.runSchematic(migrationName, {}, tree);
    const content = newTree.readContent('/test.ts');

    expect(content).toContain(`import { withRefetchOnTrigger, rxRequest } from '@angular-kit/rx-stateful';`);
    expect(content.split('\n').filter(line => line.includes('import')).length).toBe(2);
  });
});
