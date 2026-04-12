import * as walk from 'acorn-walk';

/**
 * Utility functions for walking and querying the AST.
 * All functions are null-safe — they return empty results if AST is null.
 */

export interface ASTNode {
  type: string;
  start: number;
  end: number;
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
  [key: string]: any;
}

/**
 * Find all nodes matching a predicate.
 */
export function findNodes(ast: any, predicate: (node: ASTNode) => boolean): ASTNode[] {
  if (!ast) return [];
  const results: ASTNode[] = [];
  try {
    walk.full(ast, (node: any) => {
      if (predicate(node)) results.push(node);
    });
  } catch {
    // Walk failure — return what we have
  }
  return results;
}

/**
 * Find all call expressions matching a pattern like "record.load" or "search.create".
 */
export function findCallExpressions(ast: any, objectName: string, methodName: string): ASTNode[] {
  return findNodes(ast, (node) => {
    if (node.type !== 'CallExpression') return false;
    const callee = node.callee;
    if (callee?.type === 'MemberExpression') {
      const obj = callee.object;
      const prop = callee.property;
      const objMatch = obj?.type === 'Identifier' && obj.name === objectName;
      const propMatch = prop?.type === 'Identifier' && prop.name === methodName;
      return objMatch && propMatch;
    }
    return false;
  });
}

/**
 * Find all loop nodes (for, while, do-while, for-in, for-of).
 */
export function findLoops(ast: any): ASTNode[] {
  return findNodes(ast, (node) =>
    ['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'].includes(node.type)
  );
}

/**
 * Check if a node is inside any of the given ancestor nodes.
 */
export function isInsideAny(node: ASTNode, containers: ASTNode[]): boolean {
  for (const container of containers) {
    if (node.start >= container.start && node.end <= container.end) {
      return true;
    }
  }
  return false;
}

/**
 * Find all function declarations/expressions that match entry point names.
 */
export function findFunctionsByName(ast: any, names: string[]): ASTNode[] {
  if (!ast) return [];
  const results: ASTNode[] = [];
  const nameSet = new Set(names);

  try {
    walk.full(ast, (node: any) => {
      // Function declarations: function afterSubmit() {}
      if (node.type === 'FunctionDeclaration' && node.id && nameSet.has(node.id.name)) {
        results.push(node);
      }
      // Variable declarations: const afterSubmit = function() {} or arrow
      if (node.type === 'VariableDeclarator' && node.id?.name && nameSet.has(node.id.name)) {
        if (node.init && (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')) {
          results.push(node.init);
        }
      }
      // Property assignments in return: return { afterSubmit }
      if (node.type === 'Property' && node.key?.name && nameSet.has(node.key.name)) {
        if (node.value && (node.value.type === 'FunctionExpression' || node.value.type === 'ArrowFunctionExpression')) {
          results.push(node.value);
        }
      }
    });
  } catch {
    // Walk failure
  }

  return results;
}

/**
 * Count the number of statements in a function body.
 */
export function countStatements(fnNode: ASTNode): number {
  if (fnNode.body?.type === 'BlockStatement') {
    return countStatementsRecursive(fnNode.body);
  }
  return 1; // Arrow function with expression body
}

function countStatementsRecursive(node: any): number {
  if (!node) return 0;
  let count = 0;
  if (node.type === 'BlockStatement' && node.body) {
    for (const stmt of node.body) {
      count += 1 + countStatementsRecursive(stmt);
    }
  }
  if (node.consequent) count += countStatementsRecursive(node.consequent);
  if (node.alternate) count += countStatementsRecursive(node.alternate);
  if (node.block) count += countStatementsRecursive(node.block);
  return count;
}

/**
 * Check if a node is inside a try-catch block.
 */
export function isInsideTryCatch(node: ASTNode, ast: any): boolean {
  if (!ast) return false;
  const tryCatches = findNodes(ast, n => n.type === 'TryStatement');
  return isInsideAny(node, tryCatches);
}

/**
 * Get the line number of a node.
 */
export function getLine(node: ASTNode): number {
  return node.loc?.start?.line ?? 0;
}
