import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, getLine, findNodes } from '../engine/astUtils';

/**
 * RULE 10: Dynamic Mode Misuse
 *
 * Detects record.load({ isDynamic: true }) in contexts where standard
 * mode would suffice. Dynamic mode is slower, uses more memory, and
 * is only needed for sublist manipulation with current-line operations.
 */
export const dynamicModeAbuse: Rule = {
  id: 'dynamic-mode-misuse',
  title: 'Unnecessary Dynamic Mode',
  severity: 'suggestion',
  category: 'performance',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Find isDynamic: true in record.load or record.create calls
    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];

      if (/isDynamic\s*:\s*true/.test(line)) {
        // Check if dynamic mode features are actually used (next 30 lines)
        const codeAfter = ctx.lines.slice(i, Math.min(i + 40, ctx.lines.length)).join('\n');
        const usesDynamicFeatures =
          /selectLine|selectNewLine|setCurrentSublistValue|getCurrentSublistValue|commitLine|insertLine|removeLine/.test(codeAfter);

        if (!usesDynamicFeatures) {
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `isDynamic: true at line ${i + 1} but no dynamic-mode sublist operations found.`,
            whyItMatters: 'Dynamic mode loads the record with field sourcing and validation active, which is slower and uses more memory. It\'s designed for UI-like sublist manipulation (selectLine, setCurrentSublistValue). If you\'re just reading or setting body fields, standard mode is faster.',
            recommendation: 'Remove isDynamic: true. Use standard mode with setValue/setSublistValue unless you specifically need selectLine/commitLine patterns.',
            line: i + 1,
            evidence: line.trim(),
          });
        }
      }
    }

    return findings;
  },
};
