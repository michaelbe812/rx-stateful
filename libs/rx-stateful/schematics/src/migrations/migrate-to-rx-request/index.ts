import { Rule, Tree } from '@angular-devkit/schematics';

export default function migrate(): Rule {
  return (tree: Tree) => {
    tree.visit((filePath) => {
      if (filePath.includes('node_modules')) return;
      if (!filePath.endsWith('.ts')) return;

      const content = tree.read(filePath);
      if (!content) return;

      const sourceText = content.toString();
      if (!sourceText.includes('rxStateful$')) return;

      let newContent = transformRxStateful(sourceText);
      if (newContent !== sourceText) {
        newContent = ensureImport(newContent);
        tree.overwrite(filePath, newContent);
      }
    });
    return tree;
  };
}

function hasRxRequestImport(sourceText: string): boolean {
  const importRegex = /import\s*{([^}]*)}\s*from\s*['"]@angular-kit\/rx-stateful['"];?/;
  const match = sourceText.match(importRegex);
  if (!match) return false;
  return match[1].split(',').some(name => name.trim() === 'rxRequest');
}

function ensureImport(sourceText: string): string {
  // Return unchanged if rxRequest is already imported
  if (hasRxRequestImport(sourceText)) {
    return sourceText;
  }

  // Find existing @angular-kit/rx-stateful import
  const importRegex = /import\s*{([^}]*)}\s*from\s*['"]@angular-kit\/rx-stateful['"];?/;
  const importMatch = sourceText.match(importRegex);

  if (importMatch) {
    // Add rxRequest to existing import
    const existingImports = importMatch[1].trim();
    const newImports = existingImports ? `${existingImports}, rxRequest` : 'rxRequest';
    return sourceText.replace(
      importRegex,
      `import { ${newImports} } from '@angular-kit/rx-stateful';`
    );
  }

  // Add new import at the start, after any existing imports
  const lastImportIndex = findLastImportIndex(sourceText);
  if (lastImportIndex !== -1) {
    return (
      sourceText.slice(0, lastImportIndex) +
      "\nimport { rxRequest } from '@angular-kit/rx-stateful';\n" +
      sourceText.slice(lastImportIndex)
    );
  }

  // No existing imports, add at the start of the file
  return `import { rxRequest } from '@angular-kit/rx-stateful';\n\n${sourceText}`;
}

function findLastImportIndex(sourceText: string): number {
  const importRegex = /^import.*?;?\s*$/gm;
  let lastIndex = -1;
  let match;

  while ((match = importRegex.exec(sourceText)) !== null) {
    lastIndex = match.index + match[0].length;
  }

  return lastIndex;
}

function transformRxStateful(sourceText: string): string {
  // Transform pattern with sourceTriggerConfig
  let result = sourceText.replace(
    /rxStateful\$\((.*?)\s*=>\s*(.*?),\s*{\s*sourceTriggerConfig:\s*{\s*trigger:\s*(.*?)\s*}\s*}\)/g,
    (_, param, source, trigger) =>
      `rxRequest({
    trigger: ${trigger},
    requestFn: (${param}) => ${source},
  }).value$()`
  );

  // Transform pattern with regular config
  result = result.replace(
    /rxStateful\$\((.*?),\s*{([^}]*)}\)/g,
    (match, source, config) => {
      // Skip if this is a function with arrow syntax (already handled by first replacement)
      if (source.includes('=>')) return match;

      return `rxRequest({
    requestFn: () => ${source},
    config: {${config}}
  }).value$()`;
    }
  );

  return result;
}
