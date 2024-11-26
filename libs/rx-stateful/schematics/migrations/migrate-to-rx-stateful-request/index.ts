import { Rule, Tree } from '@angular-devkit/schematics';
import { ast, match, replace } from '@phenomnomnominal/tsquery';
import { Node } from 'typescript';

export default function(): Rule {
  return (tree: Tree) => {
    tree.visit((filePath) => {
      if (!filePath.endsWith('.ts')) return;

      const content = tree.read(filePath);
      if (!content) return;

      const sourceText = content.toString();
      if (!sourceText.includes('rxStateful$')) return;

      const sourceFile = ast(sourceText);
      let newContent = sourceText;

      // Step 1: Find all rxStateful$ variables and their usages
      const rxStatefulVars = new Set<string>();

      // Find variable declarations
      match(sourceFile, 'VariableDeclaration')
        .forEach(declaration => {
          if (match(declaration, 'CallExpression > Identifier[name="rxStateful$"]').length > 0) {
            const identifier = match(declaration, 'Identifier')[0];
            if (identifier) {
              rxStatefulVars.add(identifier.getText());
            }
          }
        });

      // Find class property declarations
      match(sourceFile, 'PropertyDeclaration')
        .forEach(declaration => {
          if (match(declaration, 'CallExpression > Identifier[name="rxStateful$"]').length > 0) {
            const identifier = match(declaration, 'Identifier')[0];
            if (identifier) {
              rxStatefulVars.add(identifier.getText());
            }
          }
        });

      // Step 2: Replace rxStateful$ with rxStatefulRequest
      newContent = replace(newContent,
        'CallExpression > Identifier[name="rxStateful$"]',
        () => 'rxStatefulRequest'
      );

      // Step 3: Transform pipe operations
      rxStatefulVars.forEach(varName => {
        // Handle direct variable usage
        newContent = replace(newContent,
          `CallExpression[expression.expression.name="${varName}"]`,
          (node: Node) => {
            const text = node.getText();
            if (!text.includes('.pipe(')) return text;
            return text.replace(`${varName}.pipe`, `${varName}.value$().pipe`);
          }
        );

        // Handle this.variable usage
        newContent = replace(newContent,
          `CallExpression[expression.expression.expression.kind="ThisKeyword"][expression.expression.name="${varName}"]`,
          (node: Node) => {
            const text = node.getText();
            if (!text.includes('.pipe(')) return text;
            return text.replace(`this.${varName}.pipe`, `this.${varName}.value$().pipe`);
          }
        );
      });

      // Step 4: Transform refreshTrigger$ to refetchStrategies
      newContent = replace(newContent,
        'ObjectLiteralExpression > PropertyAssignment[name.name="refreshTrigger$"]',
        (node: Node) => {
          const triggerValue = match(node, 'PropertyAssignment > Identifier')[1];
          if (!triggerValue) return node.getText();
          return `refetchStrategies: [withRefetchOnTrigger(${triggerValue.getText()})]`;
        }
      );

      if (newContent !== sourceText) {
        tree.overwrite(filePath, newContent);
      }
    });
    return tree;
  };
}
