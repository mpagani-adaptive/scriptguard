import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, findLoops, isInsideAny, getLine } from '../engine/astUtils';

/**
 * RULE 1: Record Load Inside Loop
 *
 * Detects record.load() calls inside any loop construct.
 * Each record.load costs 5-10 governance units. Inside a loop processing
 * 500 lines, that's 2500-5000 units — enough to blow governance on a
 * single User Event execution.
 */
export const recordLoadInLoop: Rule = {
  id: 'record-load-in-loop',
  title: 'Record Load Inside Loop',
  severity: 'critical',
  category: 'governance',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // AST-based detection
    if (ctx.ast) {
      const loops = findLoops(ctx.ast);
      const loads = findCallExpressions(ctx.ast, 'record', 'load');

      for (const load of loads) {
        if (isInsideAny(load, loops)) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `record.load() called inside a loop at line ${getLine(load)}.`,
            whyItMatters: 'Each record.load() costs 5-10 governance units. In a loop over 200+ records, this will exceed governance limits and crash the script. It will pass QA with 5 test records and fail in production with real volume.',
            recommendation: 'Use record.submitFields() for field updates. If you need the full record, load it before the loop or restructure to Map/Reduce where each iteration gets its own governance.',
            line: getLine(load),
            evidence: ctx.lines[getLine(load) - 1]?.trim(),
          });
        }
      }
    }

    // Regex fallback for unparseable code
    if (!ctx.ast || findings.length === 0) {
      const loopPattern = /\b(for|while|do)\b/;
      let inLoop = 0;
      for (let i = 0; i < ctx.lines.length; i++) {
        const line = ctx.lines[i];
        if (loopPattern.test(line)) inLoop++;
        if (line.includes('}') && inLoop > 0) inLoop--;
        if (inLoop > 0 && /record\.load\s*\(/.test(line)) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `record.load() appears inside a loop at line ${i + 1}.`,
            whyItMatters: 'Each record.load() costs 5-10 governance units. In a loop over 200+ records, this will exceed governance limits and crash the script.',
            recommendation: 'Use record.submitFields() for field updates, or restructure to Map/Reduce.',
            line: i + 1,
            evidence: line.trim(),
          });
        }
      }
    }

    return findings;
  },
};
