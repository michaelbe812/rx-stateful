import { Rule, Tree } from '@angular-devkit/schematics';

export default function(): Rule {
  return (tree: Tree) => {
    tree.visit((filePath) => {
      if (!filePath.endsWith('.ts')) return;

      const content = tree.read(filePath);
      if (!content) return;

      const sourceText = content.toString();
      if (!sourceText.includes('refreshTrigger$')) return;

      const needsImport = !sourceText.includes('withRefetchOnTrigger');
      let newContent = transformRefreshTrigger(sourceText);

      if (needsImport) {
        newContent = addWithRefetchOnTriggerImport(newContent);
      }

      if (newContent !== sourceText) {
        tree.overwrite(filePath, newContent);
      }
    });
    return tree;
  };
}

function addWithRefetchOnTriggerImport(sourceText: string): string {
  const importStatement = "import { withRefetchOnTrigger } from '@angular-kit/rx-stateful';";

  // Check if there are existing imports from @angular-kit/rx-stateful
  const existingImportRegex = /import\s*{([^}]*)}\s*from\s*['"]@angular-kit\/rx-stateful['"];/;
  const existingImportMatch = sourceText.match(existingImportRegex);

  if (existingImportMatch) {
    // Append to existing import
    const existingImports = existingImportMatch[1];
    const newImports = existingImports.includes('withRefetchOnTrigger')
      ? existingImports
      : `${existingImports}, withRefetchOnTrigger`;
    return sourceText.replace(existingImportRegex, `import { ${newImports} } from '@angular-kit/rx-stateful';`);
  }

  // Add new import statement at the top of the file
  return `${importStatement}\n${sourceText}`;
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
      `rxStateful$(${source}, { refetchStrategies: [withRefetchOnTrigger(${trigger})] })`
  );

  return result;
}
