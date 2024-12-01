import { Rule, Tree } from '@angular-devkit/schematics';

export default function(): Rule {
  return (tree: Tree) => {
    tree.visit((filePath) => {
      if (!filePath.endsWith('.ts')) return;

      const content = tree.read(filePath);
      if (!content) return;

      const sourceText = content.toString();
      if (!sourceText.includes('refreshTrigger$')) return;

      const newContent = transformRefreshTrigger(sourceText);
      if (newContent !== sourceText) {
        tree.overwrite(filePath, newContent);
      }
    });
    return tree;
  };
}

function transformRefreshTrigger(sourceText: string): string {
  // Handle case with existing refetchStrategies
  let result = sourceText.replace(
    /rxStateful\$\((.*?),\s*{\s*refreshTrigger\$:\s*(.*?),\s*refetchStrategies:\s*\[(.*?)\]\s*}\)/g,
    (_, source, trigger, strategies) =>
      `rxStateful$(${source}, { refetchStrategies: [${strategies}, withRefetchOnTrigger(${trigger})] })`
  );

  // Handle simple case without existing refetchStrategies
  result = result.replace(
    /rxStateful\$\((.*?),\s*{\s*refreshTrigger\$:\s*(.*?)\s*}\)/g,
    (_, source, trigger) =>
      `rxStatefulRequest(${source}, {refetchStrategies: [withRefetchOnTrigger(${trigger})]})`
  );

  return result;
}
