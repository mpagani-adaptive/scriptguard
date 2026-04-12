import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, findNodes, isInsideTryCatch, getLine } from '../engine/astUtils';

/**
 * RULE 9: Missing Error Handling
 *
 * Detects critical operations (record saves, HTTP calls, search execution)
 * without try-catch protection. Silent failures in production are the #1
 * debugging nightmare in NetSuite.
 */
export const missingErrorHandling: Rule = {
  id: 'missing-error-handling',
  title: 'Missing Error Handling',
  severity: 'warning',
  category: 'error-handling',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    if (ctx.ast) {
      // Critical operations that should be wrapped in try-catch
      const criticalCalls = [
        ...findCallExpressions(ctx.ast, 'https', 'get'),
        ...findCallExpressions(ctx.ast, 'https', 'post'),
        ...findCallExpressions(ctx.ast, 'https', 'put'),
        ...findCallExpressions(ctx.ast, 'https', 'delete'),
        ...findCallExpressions(ctx.ast, 'https', 'request'),
        ...findCallExpressions(ctx.ast, 'http', 'get'),
        ...findCallExpressions(ctx.ast, 'http', 'post'),
        ...findCallExpressions(ctx.ast, 'record', 'load'),
        ...findCallExpressions(ctx.ast, 'record', 'save'),
        ...findCallExpressions(ctx.ast, 'record', 'delete'),
        ...findCallExpressions(ctx.ast, 'record', 'submitFields'),
        ...findCallExpressions(ctx.ast, 'email', 'send'),
      ];

      // Find save() calls on record instances (not record.save but rec.save())
      const instanceSaves = findNodes(ctx.ast, (node) =>
        node.type === 'CallExpression' &&
        node.callee?.type === 'MemberExpression' &&
        node.callee.property?.name === 'save' &&
        node.callee.object?.type === 'Identifier'
      );
      criticalCalls.push(...instanceSaves);

      for (const call of criticalCalls) {
        if (!isInsideTryCatch(call, ctx.ast)) {
          const line = getLine(call);
          const calleeName = call.callee?.property?.name || 'operation';
          const objName = call.callee?.object?.name || '';
          const fullName = objName ? `${objName}.${calleeName}` : calleeName;

          findings.push({
            ruleId: this.id,
            severity: fullName.includes('https') || fullName.includes('http') ? 'critical' : this.severity,
            category: this.category,
            title: this.title,
            issue: `${fullName}() at line ${line} is not inside a try-catch.`,
            whyItMatters: `This will throw an unhandled exception on failure. ${fullName.includes('http') ? 'External APIs fail regularly — timeouts, 500s, network issues. ' : ''}Without error handling, the entire script crashes, the user sees a generic error, and you have no log trail to debug it.`,
            recommendation: 'Wrap in try-catch with log.error() that includes the record ID, operation context, and error details. Re-throw only if the failure should block the transaction.',
            line,
            evidence: ctx.lines[line - 1]?.trim(),
          });
        }
      }
    }

    // Regex fallback
    if (!ctx.ast) {
      const criticalPattern = /\b(https?\.(get|post|put|delete|request)|record\.(load|save|delete|submitFields)|email\.send|\.save\s*\()\s*\(/;
      for (let i = 0; i < ctx.lines.length; i++) {
        if (criticalPattern.test(ctx.lines[i])) {
          // Check if we're inside a try block (simple heuristic)
          let insideTry = false;
          for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
            if (/\btry\s*\{/.test(ctx.lines[j])) { insideTry = true; break; }
            if (/\bcatch\s*\(/.test(ctx.lines[j])) break;
          }
          if (!insideTry) {
            findings.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              title: this.title,
              issue: `Unprotected API call at line ${i + 1}.`,
              whyItMatters: 'Unhandled exceptions crash the script with no log trail.',
              recommendation: 'Wrap in try-catch with log.error().',
              line: i + 1,
              evidence: ctx.lines[i].trim(),
            });
          }
        }
      }
    }

    return findings;
  },
};
