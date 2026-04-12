import type { Rule, RuleContext, Finding } from '../types';

/**
 * RULE 8: Hardcoded Internal IDs
 *
 * Detects numeric literals used as record IDs, field IDs, or in
 * NetSuite API calls. Hardcoded IDs break across sandbox/production
 * and make code unmaintainable.
 */
export const hardcodedIds: Rule = {
  id: 'hardcoded-ids',
  title: 'Hardcoded Internal IDs',
  severity: 'warning',
  category: 'maintainability',

  detect(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const seen = new Set<number>();

    // Patterns that indicate hardcoded IDs in NetSuite context
    const patterns: Array<{ regex: RegExp; description: string }> = [
      // record.load({ type: 'x', id: 123 })
      { regex: /\bid\s*:\s*(\d{2,})/g, description: 'record ID' },
      // Type references with numbers: type: 'customrecord123' is fine, but id: 456 is not
      { regex: /(?:subsidiary|location|department|class|employee|customer|vendor)\s*[:=]\s*(\d+)/gi, description: 'entity/classification ID' },
      // defaultValues with numeric IDs
      { regex: /defaultValues?\s*:\s*\{[^}]*?:\s*(\d{2,})/g, description: 'default value ID' },
      // Direct numeric arguments to lookup/load
      { regex: /(?:lookupFields|load|delete|submitFields)\s*\(\s*\{[^}]*?id\s*:\s*(\d{2,})/g, description: 'API call ID' },
      // Form IDs
      { regex: /(?:customform|form)\s*[:=]\s*(\d+)/gi, description: 'form ID' },
      // Inline numeric IDs in filters: ['entity', 'is', 123]
      { regex: /\[\s*['"][^'"]+['"]\s*,\s*['"][^'"]+['"]\s*,\s*(\d{2,})\s*\]/g, description: 'search filter value' },
    ];

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];

      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      for (const { regex, description } of patterns) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const num = parseInt(match[1], 10);
          // Ignore small numbers (likely not IDs) and common constants
          if (num < 10 || seen.has(i)) continue;
          // Ignore line counts, indices, page sizes
          if (/\b(start|end|pageSize|offset|limit|count|length|index|i|j)\s*[:=]/.test(line)) continue;
          // Ignore governance/unit thresholds
          if (/getRemainingUsage|governance/i.test(line)) continue;

          seen.add(i);
          findings.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            title: this.title,
            issue: `Hardcoded ${description} (${num}) at line ${i + 1}.`,
            whyItMatters: 'Internal IDs differ between sandbox and production. This code will break on deployment, or worse — silently reference the wrong record. Every environment promotion becomes a manual find-and-replace exercise.',
            recommendation: 'Store IDs in a Script Parameter (N/runtime), a custom record config table, or a constants module. Use script deployments to set environment-specific values.',
            line: i + 1,
            evidence: line.trim(),
          });
          break; // One finding per line
        }
      }
    }

    return findings;
  },
};
