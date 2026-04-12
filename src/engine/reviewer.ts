import type { Finding, ReviewResult, Severity } from '../types';
import { parseCode } from './parser';
import { ALL_RULES } from '../rules';

/**
 * Core review engine. Runs all static rules against parsed code.
 * Returns a structured ReviewResult.
 */
export function reviewCode(code: string): ReviewResult {
  const context = parseCode(code);

  const allFindings: Finding[] = [];

  for (const rule of ALL_RULES) {
    try {
      const findings = rule.detect(context);
      allFindings.push(...findings);
    } catch (err) {
      // A rule failure should never crash the review
      console.error(`Rule ${rule.id} failed:`, err);
    }
  }

  // Deduplicate by line + ruleId
  const seen = new Set<string>();
  const findings = allFindings.filter(f => {
    const key = `${f.ruleId}:${f.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: critical first, then by line number
  const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, suggestion: 2 };
  findings.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return (a.line ?? 0) - (b.line ?? 0);
  });

  const riskLevel = calculateRisk(findings);
  const summary = generateSummary(findings, context.scriptType, riskLevel);

  return {
    findings,
    summary,
    riskLevel,
    scriptType: context.scriptType ?? undefined,
    aiEnhanced: false,
  };
}

function calculateRisk(findings: Finding[]): ReviewResult['riskLevel'] {
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;

  if (criticalCount >= 3) return 'CRITICAL';
  if (criticalCount >= 1) return 'HIGH';
  if (warningCount >= 3) return 'MEDIUM';
  if (warningCount >= 1) return 'LOW';
  return 'LOW';
}

function generateSummary(findings: Finding[], scriptType: string | null, riskLevel: string): string {
  if (findings.length === 0) {
    return 'No issues found. Code looks clean — but static analysis has limits. Consider an AI-enhanced review for deeper architectural feedback.';
  }

  const critical = findings.filter(f => f.severity === 'critical');
  const warnings = findings.filter(f => f.severity === 'warning');
  const suggestions = findings.filter(f => f.severity === 'suggestion');

  const parts: string[] = [];
  const typeLabel = scriptType ? ` ${scriptType} script` : ' script';

  if (critical.length > 0) {
    parts.push(`${critical.length} critical issue${critical.length > 1 ? 's' : ''} that will fail in production`);
  }
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length > 1 ? 's' : ''}`);
  }
  if (suggestions.length > 0) {
    parts.push(`${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}`);
  }

  return `This${typeLabel} has ${parts.join(', ')}. ${riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'Do not deploy without addressing the critical findings.' : 'Review the findings before deploying.'}`;
}
