import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, getLine, findNodes } from '../engine/astUtils';

/**
 * RULE 7: Unbounded Search Results
 *
 * Detects search.create().run().each() or search.create() without
 * explicit pagination or result limits. Unbounded searches can
 * return thousands of results, consuming memory and governance.
 */
export const unboundedSearch: Rule = {
  id: 'unbounded-search',
  title: 'Unbounded Search Results',
  severity: 'warning',
  category: 'performance',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Look for search patterns without pagination
    const hasRunEach = /\.run\(\)\s*\.each\s*\(/.test(ctx.code);
    const hasGetRange = /\.getRange\s*\(/.test(ctx.code);
    const hasRunPaged = /\.runPaged\s*\(/.test(ctx.code);
    const hasPagedData = /pagedData|pageRanges|fetch/.test(ctx.code);
    const hasResultLimit = /\.getRange\s*\(\s*\{\s*start.*end/.test(ctx.code);

    if (ctx.ast) {
      const searchCreates = findCallExpressions(ctx.ast, 'search', 'create');

      for (const sc of searchCreates) {
        const line = getLine(sc);

        // Check if this search has any pagination/limiting applied
        // Look in the surrounding code (next 15 lines) for pagination indicators
        const codeAfter = ctx.lines.slice(line - 1, line + 15).join('\n');
        const hasLimit = /\.getRange\s*\(|\.runPaged\s*\(|pagedData|pageSize|\.slice\s*\(/.test(codeAfter);

        // .run().each() is technically bounded (4000 results) but developers often don't know that
        const usesRunEach = /\.run\(\)\s*\.each\s*\(/.test(codeAfter);

        if (!hasLimit && !usesRunEach) {
          // Search created but no visible result-handling pattern
          // This might be passed to another function, so only flag if we see .run()
          if (/\.run\s*\(/.test(codeAfter) && !/\.runPaged/.test(codeAfter)) {
            findings.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              title: this.title,
              issue: `Search at line ${line} uses .run() without explicit pagination or result limiting.`,
              whyItMatters: 'search.run().getRange() without bounds or .run().each() silently caps at 4000 results. If your dataset grows beyond that, you silently lose records. Using .runPaged() with explicit page sizes gives you control and handles any result volume.',
              recommendation: 'Use search.runPaged({ pageSize: 1000 }) for large result sets. For small known sets, use .run().getRange({ start: 0, end: 100 }) with explicit bounds.',
              line,
              evidence: ctx.lines[line - 1]?.trim(),
            });
          }
        }
      }
    }

    // Regex fallback
    if (!ctx.ast) {
      for (let i = 0; i < ctx.lines.length; i++) {
        if (/search\.create\s*\(/.test(ctx.lines[i]) || /search\.load\s*\(/.test(ctx.lines[i])) {
          const lookahead = ctx.lines.slice(i, i + 15).join('\n');
          if (/\.run\s*\(/.test(lookahead) && !/\.runPaged/.test(lookahead) && !/\.getRange/.test(lookahead)) {
            findings.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              title: this.title,
              issue: `Search at line ${i + 1} without explicit pagination.`,
              whyItMatters: 'Unbounded searches silently cap results and consume unnecessary resources.',
              recommendation: 'Use .runPaged() for large datasets or .getRange() with explicit bounds.',
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  },
};
