import type { Rule, RuleContext, Finding } from '../types';
import { findNodes, findLoops, isInsideAny, getLine } from '../engine/astUtils';

/**
 * RULE 6: API Calls Inside Loop (N+1 Pattern)
 *
 * Detects NetSuite API calls (https.get/post, record ops, search ops,
 * email.send, etc.) inside loops. This is the single most common
 * cause of governance failures in production SuiteScript.
 */
export const apiCallInLoop: Rule = {
  id: 'api-call-in-loop',
  title: 'API Call Inside Loop (N+1)',
  severity: 'critical',
  category: 'governance',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const seen = new Set<number>(); // avoid duplicates with other rules

    if (ctx.ast) {
      const loops = findLoops(ctx.ast);
      if (loops.length === 0) return findings;

      // Find all API calls that cost governance
      const apiCalls = findNodes(ctx.ast, (node) => {
        if (node.type !== 'CallExpression') return false;
        const callee = node.callee;
        if (callee?.type !== 'MemberExpression') return false;

        const obj = callee.object?.name;
        const method = callee.property?.name;

        // https module calls
        if (obj === 'https' && ['get', 'post', 'put', 'delete', 'request'].includes(method)) return true;
        // http module calls
        if (obj === 'http' && ['get', 'post', 'put', 'delete', 'request'].includes(method)) return true;
        // record operations (load/create/save/delete/submitFields already covered by rule 1, but this catches broader patterns)
        if (obj === 'record' && ['create', 'delete', 'copy', 'transform'].includes(method)) return true;
        // email
        if (obj === 'email' && ['send', 'sendBulk'].includes(method)) return true;
        // file operations
        if (obj === 'file' && ['load', 'create'].includes(method)) return true;
        // task (scheduled script invocations)
        if (obj === 'task' && method === 'create') return true;

        return false;
      });

      for (const call of apiCalls) {
        const line = getLine(call);
        if (seen.has(line)) continue;
        if (isInsideAny(call, loops)) {
          seen.add(line);
          const callee = call.callee;
          const apiName = `${callee.object?.name}.${callee.property?.name}`;
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `${apiName}() called inside a loop at line ${line}.`,
            whyItMatters: `Every iteration makes a server round-trip. At production volume (hundreds or thousands of iterations), this will exhaust governance, timeout, or both. It passes QA because your test has 3 records.`,
            recommendation: 'Batch the operation. Collect the data in the loop, then make one call (or chunked calls) outside the loop. For record operations, consider Map/Reduce where each iteration gets its own governance.',
            line,
            evidence: ctx.lines[line - 1]?.trim(),
          });
        }
      }
    }

    // Regex fallback
    if (!ctx.ast) {
      const apiPattern = /\b(https?|email|file|task)\.(get|post|put|delete|request|send|sendBulk|load|create)\s*\(/;
      let inLoop = false;
      let depth = 0;
      for (let i = 0; i < ctx.lines.length; i++) {
        const line = ctx.lines[i];
        if (/\b(for|while|do)\s*[\(\{]/.test(line)) inLoop = true;
        depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (depth <= 0) { inLoop = false; depth = 0; }
        if (inLoop && apiPattern.test(line)) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `API call inside loop at line ${i + 1}.`,
            whyItMatters: 'N+1 API call pattern — each iteration is a server round-trip.',
            recommendation: 'Batch operations outside the loop.',
            line: i + 1,
            evidence: line.trim(),
          });
        }
      }
    }

    return findings;
  },
};
