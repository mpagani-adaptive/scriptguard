import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, findLoops, isInsideAny, getLine } from '../engine/astUtils';

/**
 * RULE 2: Search Execution Inside Loop
 *
 * Detects search.create(), search.load(), or .run() inside loops.
 * Each search costs governance units and round-trips. Inside a loop,
 * this creates N+1 query patterns that degrade exponentially.
 */
export const searchInLoop: Rule = {
  id: 'search-in-loop',
  title: 'Search Execution Inside Loop',
  severity: 'critical',
  category: 'performance',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    if (ctx.ast) {
      const loops = findLoops(ctx.ast);

      const searchCalls = [
        ...findCallExpressions(ctx.ast, 'search', 'create'),
        ...findCallExpressions(ctx.ast, 'search', 'load'),
        ...findCallExpressions(ctx.ast, 'search', 'lookupFields'),
      ];

      for (const call of searchCalls) {
        if (isInsideAny(call, loops)) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `Search API call inside a loop at line ${getLine(call)}.`,
            whyItMatters: 'Each search is a server round-trip with governance cost. 500 iterations = 500 searches. This is the classic N+1 pattern — it works in dev, crawls in production, and eventually times out.',
            recommendation: 'Run the search ONCE before the loop and build a lookup map. For lookupFields, batch the IDs and query once with an IN filter.',
            line: getLine(call),
            evidence: ctx.lines[getLine(call) - 1]?.trim(),
          });
        }
      }
    }

    // Regex fallback
    if (!ctx.ast) {
      const searchPattern = /search\.(create|load|lookupFields)\s*\(/;
      let braceDepth = 0;
      let inLoop = false;
      for (let i = 0; i < ctx.lines.length; i++) {
        const line = ctx.lines[i];
        if (/\b(for|while|do)\s*\(/.test(line)) inLoop = true;
        braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (braceDepth <= 0) { inLoop = false; braceDepth = 0; }
        if (inLoop && searchPattern.test(line)) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `Search API call inside a loop at line ${i + 1}.`,
            whyItMatters: 'N+1 search pattern — works in dev, fails at production volume.',
            recommendation: 'Run the search once before the loop and build a lookup map.',
            line: i + 1,
            evidence: line.trim(),
          });
        }
      }
    }

    return findings;
  },
};
