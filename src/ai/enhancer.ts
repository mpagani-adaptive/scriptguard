import type { ReviewResult, Finding } from '../types';

/**
 * AI enhancement layer. Takes static analysis results and enriches them
 * with Claude's deeper architectural reasoning.
 *
 * This NEVER replaces the static rules — it adds context, catches
 * patterns that require semantic understanding, and provides
 * architectural-level feedback.
 */

const SYSTEM_PROMPT = `You are a senior NetSuite SuiteScript architect with 10+ years of production experience.

You are enhancing a static analysis review. The static rules have already found specific issues.
Your job is to provide ADDITIONAL findings that require deeper reasoning — things static rules can't catch:

- Architectural misfit (wrong script type for the job)
- Business logic risks
- Cross-script interaction problems
- Missing context checks (checking context.type in User Events)
- SuiteScript version-specific gotchas
- Subtle governance accumulation across operations

Do NOT repeat findings that are already in the static analysis.
Do NOT provide generic advice. Be specific to this code.
Be blunt. Be direct. No filler.

Return ONLY valid JSON array of additional findings:

[
  {
    "severity": "critical | warning | suggestion",
    "category": "governance | performance | reliability | security | architecture | error-handling | maintainability | anti-pattern",
    "title": "Short title",
    "issue": "What's wrong — specific to this code",
    "whyItMatters": "Production impact",
    "recommendation": "Concrete fix"
  }
]

If the static analysis already caught everything, return an empty array: []`;

export async function enhanceReview(
  code: string,
  staticResult: ReviewResult,
  apiKey: string,
  model: string,
): Promise<ReviewResult> {
  // Dynamic import to avoid loading SDK when AI is disabled
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });

  const staticSummary = staticResult.findings
    .map(f => `- [${f.severity}] ${f.title}: ${f.issue}`)
    .join('\n');

  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Static analysis already found:\n${staticSummary || '(no issues found)'}\n\nReview this code for ADDITIONAL issues:\n\n\`\`\`javascript\n${code}\n\`\`\``,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  let aiFindings: Finding[] = [];
  try {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      aiFindings = parsed.map((f: any) => ({
        ruleId: 'ai-insight',
        severity: f.severity || 'suggestion',
        category: f.category || 'architecture',
        title: f.title || 'AI Finding',
        issue: f.issue || '',
        whyItMatters: f.whyItMatters || f.why_it_matters || '',
        recommendation: f.recommendation || f.suggested_fix || '',
      }));
    }
  } catch {
    // AI response wasn't valid JSON — skip AI findings
  }

  return {
    ...staticResult,
    findings: [...staticResult.findings, ...aiFindings],
    aiEnhanced: true,
  };
}
