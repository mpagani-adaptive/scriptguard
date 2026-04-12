import type { Rule, RuleContext, Finding } from '../types';
import { findCallExpressions, getLine, findNodes } from '../engine/astUtils';

/**
 * RULE 5: No Idempotency Protection
 *
 * Detects record creation without duplicate-checking logic.
 * NetSuite retries scripts on timeout. Scheduled scripts can re-execute.
 * Without idempotency, you get duplicate records.
 */
export const noIdempotency: Rule = {
  id: 'no-idempotency',
  title: 'No Idempotency Protection',
  severity: 'warning',
  category: 'reliability',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    // Only check scripts that create records
    const createCalls = ctx.ast
      ? findCallExpressions(ctx.ast, 'record', 'create')
      : [];

    // Also check regex for record.create
    const hasCreate = createCalls.length > 0 || /record\.create\s*\(/.test(ctx.code);
    if (!hasCreate) return findings;

    // Look for idempotency indicators
    const hasSearchBefore = /search\.(create|lookupFields|load)\s*\(/.test(ctx.code);
    const hasDuplicateCheck = /duplicate|idempoten|already.exist|existing/i.test(ctx.code);
    const hasExternalId = /externalid|externalId|external_id/i.test(ctx.code);
    const hasUniqueCheck = /unique|upsert/i.test(ctx.code);

    // If creating records without any form of duplicate protection
    if (!hasSearchBefore && !hasDuplicateCheck && !hasExternalId && !hasUniqueCheck) {
      // Check if this is in a MapReduce, Scheduled, or Restlet (retry-prone contexts)
      const isRetryProne = ctx.scriptType === 'MapReduce' || ctx.scriptType === 'Scheduled' || ctx.scriptType === 'Restlet';

      if (ctx.ast) {
        for (const create of createCalls) {
          findings.push({
            ruleId: this.id,
            severity: isRetryProne ? 'critical' : this.severity,
            category: this.category,
            title: this.title,
            issue: `record.create() at line ${getLine(create)} with no duplicate-checking logic.`,
            whyItMatters: `NetSuite retries scripts on timeout. ${isRetryProne ? 'This is a ' + ctx.scriptType + ' script — retries are guaranteed under load. ' : ''}Without idempotency protection, a retry creates duplicate records. This is how you end up with 400 duplicate invoices on a Monday morning.`,
            recommendation: 'Search for existing records before creating. Use externalid for upsert behavior. For Map/Reduce, check for existing records in the map stage before writing.',
            line: getLine(create),
            evidence: ctx.lines[getLine(create) - 1]?.trim(),
          });
        }
      } else {
        // Regex fallback
        for (let i = 0; i < ctx.lines.length; i++) {
          if (/record\.create\s*\(/.test(ctx.lines[i])) {
            findings.push({
              ruleId: this.id,
              severity: isRetryProne ? 'critical' : this.severity,
              category: this.category,
              title: this.title,
              issue: `record.create() at line ${i + 1} with no visible duplicate protection.`,
              whyItMatters: 'Script retries + no idempotency = duplicate records in production.',
              recommendation: 'Add a search-before-create pattern or use externalid.',
              line: i + 1,
            });
          }
        }
      }
    }

    return findings;
  },
};
