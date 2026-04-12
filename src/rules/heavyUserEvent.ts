import type { Rule, RuleContext, Finding } from '../types';
import { findFunctionsByName, countStatements, findCallExpressions, getLine, findNodes } from '../engine/astUtils';

/**
 * RULE 3: User Event Doing Heavy Processing
 *
 * Detects large logic blocks in beforeSubmit/afterSubmit.
 * User Events run synchronously during record save. Heavy logic
 * blocks the UI, causes timeouts, and makes users hate NetSuite.
 */
export const heavyUserEvent: Rule = {
  id: 'heavy-user-event',
  title: 'Heavy Processing in User Event',
  severity: 'warning',
  category: 'architecture',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    if (ctx.scriptType !== 'UserEvent') return findings;

    if (ctx.ast) {
      const entryFns = findFunctionsByName(ctx.ast, ['beforeSubmit', 'afterSubmit']);

      for (const fn of entryFns) {
        const stmtCount = countStatements(fn);
        const hasLoops = findNodes(fn, n =>
          ['ForStatement', 'WhileStatement', 'ForInStatement', 'ForOfStatement'].includes(n.type)
        ).length > 0;

        const hasHttpCalls = findNodes(fn, n =>
          n.type === 'CallExpression' &&
          n.callee?.type === 'MemberExpression' &&
          n.callee.object?.name === 'https'
        ).length > 0;

        const hasMultipleRecordOps = findCallExpressions(ctx.ast, 'record', 'load').length +
          findCallExpressions(ctx.ast, 'record', 'create').length +
          findCallExpressions(ctx.ast, 'record', 'save').length;

        if (stmtCount > 20 || (hasLoops && stmtCount > 10) || hasHttpCalls || hasMultipleRecordOps > 3) {
          findings.push({
            ruleId: this.id,
            severity: hasHttpCalls ? 'critical' : this.severity,
            category: this.category,
            title: this.title,
            issue: `${hasHttpCalls ? 'HTTP calls' : 'Heavy logic'} in User Event entry point (~${stmtCount} statements${hasLoops ? ', contains loops' : ''}).`,
            whyItMatters: 'User Events run synchronously during record save. This blocks the UI for every user saving this record. HTTP calls can timeout. Loops multiply the problem. Users will report "NetSuite is slow" and you\'ll be debugging a User Event.',
            recommendation: hasHttpCalls
              ? 'Move HTTP calls to a Scheduled Script or Map/Reduce triggered by the User Event. Never make external calls during save.'
              : 'Move heavy processing to a Map/Reduce or Scheduled Script. The User Event should only validate or set fields, then trigger async processing.',
            line: getLine(fn),
          });
        }
      }
    }

    // Regex fallback: count lines in entry point functions
    if (!ctx.ast) {
      const entryPattern = /\b(beforeSubmit|afterSubmit)\s*[:=]\s*(?:function|\()/;
      for (let i = 0; i < ctx.lines.length; i++) {
        if (entryPattern.test(ctx.lines[i])) {
          // Count lines until matching brace
          let depth = 0;
          let lineCount = 0;
          let hasHttp = false;
          for (let j = i; j < ctx.lines.length; j++) {
            depth += (ctx.lines[j].match(/\{/g) || []).length;
            depth -= (ctx.lines[j].match(/\}/g) || []).length;
            lineCount++;
            if (/https\.(get|post|put|delete|request)\s*\(/.test(ctx.lines[j])) hasHttp = true;
            if (depth <= 0 && j > i) break;
          }
          if (lineCount > 30 || hasHttp) {
            findings.push({
              ruleId: this.id,
              severity: hasHttp ? 'critical' : this.severity,
              category: this.category,
              title: this.title,
              issue: `Large entry point function (~${lineCount} lines) at line ${i + 1}${hasHttp ? ' with HTTP calls' : ''}.`,
              whyItMatters: 'User Events block record saves. Heavy logic here means slow saves for every user.',
              recommendation: 'Move heavy logic to Map/Reduce or Scheduled Script.',
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  },
};
