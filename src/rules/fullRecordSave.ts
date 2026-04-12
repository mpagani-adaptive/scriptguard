import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, getLine, findNodes, isInsideAny } from '../engine/astUtils';

/**
 * RULE 4: Full Record Save for Small Update
 *
 * Detects record.load() + record.save() patterns where submitFields
 * would suffice. A full save triggers all User Events, workflows,
 * and costs 2-4x the governance of submitFields.
 */
export const fullRecordSave: Rule = {
  id: 'full-record-save',
  title: 'Full Record Save for Field Update',
  severity: 'warning',
  category: 'governance',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    if (ctx.ast) {
      // Find patterns: load a record, set a few fields, save it
      const loads = findCallExpressions(ctx.ast, 'record', 'load');

      for (const load of loads) {
        // Look for .save() after load in the same scope
        // Find setValue calls between load and save
        const setValueCalls = findNodes(ctx.ast, n =>
          n.type === 'CallExpression' &&
          n.callee?.type === 'MemberExpression' &&
          n.callee.property?.name === 'setValue' &&
          n.start > load.start
        );

        const saveCalls = findNodes(ctx.ast, n =>
          n.type === 'CallExpression' &&
          n.callee?.type === 'MemberExpression' &&
          n.callee.property?.name === 'save' &&
          n.start > load.start
        );

        // If we see load → few setValues → save, that's a submitFields candidate
        if (saveCalls.length > 0 && setValueCalls.length > 0 && setValueCalls.length <= 5) {
          // Check there's no sublist manipulation (which requires full record)
          const sublistOps = findNodes(ctx.ast, n =>
            n.type === 'CallExpression' &&
            n.callee?.type === 'MemberExpression' &&
            ['setSublistValue', 'insertLine', 'removeLine', 'selectLine', 'selectNewLine'].includes(n.callee.property?.name) &&
            n.start > load.start && n.start < (saveCalls[0]?.start ?? Infinity)
          );

          if (sublistOps.length === 0) {
            findings.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              title: this.title,
              issue: `record.load() + ${setValueCalls.length} setValue() + save() at line ${getLine(load)} — submitFields would work here.`,
              whyItMatters: 'A full record.load() + save() costs 10-20 governance units, triggers all User Events and workflows on the record, and is 2-4x slower than submitFields. If this runs in a loop or scheduled process, it compounds fast.',
              recommendation: `Use record.submitFields({ type, id, values: { field: value } }). It's a single API call, costs fewer governance units, and skips re-triggering User Events unless you set options.enableSourcing.`,
              line: getLine(load),
              evidence: ctx.lines[getLine(load) - 1]?.trim(),
            });
          }
        }
      }
    }

    // Regex fallback: detect load → setValue → save pattern
    if (!ctx.ast) {
      const loadPattern = /record\.load\s*\(/;
      const setPattern = /\.setValue\s*\(/;
      const savePattern = /\.save\s*\(/;

      for (let i = 0; i < ctx.lines.length; i++) {
        if (loadPattern.test(ctx.lines[i])) {
          let setCount = 0;
          let saveFound = false;
          let hasSublist = false;
          for (let j = i + 1; j < Math.min(i + 20, ctx.lines.length); j++) {
            if (setPattern.test(ctx.lines[j])) setCount++;
            if (savePattern.test(ctx.lines[j])) { saveFound = true; break; }
            if (/setSublistValue|insertLine|removeLine/.test(ctx.lines[j])) hasSublist = true;
          }
          if (saveFound && setCount > 0 && setCount <= 5 && !hasSublist) {
            findings.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              title: this.title,
              issue: `Load + ${setCount} setValue + save pattern at line ${i + 1} — use submitFields instead.`,
              whyItMatters: 'Full record save is 2-4x more expensive than submitFields and re-triggers all automation.',
              recommendation: 'Use record.submitFields() for simple field updates.',
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  },
};
