import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const REVIEW_SYSTEM_PROMPT = `You are a senior NetSuite SuiteScript reviewer.

You are reviewing a highlighted block of SuiteScript or a full script file.

Your job is to act like an experienced production-focused reviewer, not a tutor.

Focus on:

- governance risk
- performance problems
- heavy save-time logic
- error handling gaps
- maintainability issues
- hardcoded internal IDs
- SuiteScript anti-patterns
- production failure risk under real volume

Do not rewrite the code unless explicitly asked.
Do not modernize or convert the code.
Do not explain beginner concepts.
Be direct.

Return ONLY valid JSON in this exact shape:

{
  "risk_level": "LOW | MEDIUM | HIGH",
  "summary": "Short blunt assessment.",
  "findings": [
    {
      "title": "Short issue name",
      "severity": "LOW | MEDIUM | HIGH",
      "category": "GOVERNANCE | PERFORMANCE | ERROR_HANDLING | MAINTAINABILITY | SECURITY | SCRIPT_DESIGN",
      "evidence": "Point to the actual pattern in the code.",
      "why_it_matters": "Explain the production consequence.",
      "suggested_fix": "Concrete next step."
    }
  ],
  "governance_assessment": {
    "estimated_risk": "LOW | MEDIUM | HIGH",
    "notes": "Short estimate based on visible patterns only."
  },
  "review_note": "One final senior-level comment."
}

Review the supplied code as if it runs in a real NetSuite production account under load.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, apiKey } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (code.length > 50000) {
      return NextResponse.json(
        { error: "Code exceeds 50,000 character limit" },
        { status: 400 }
      );
    }

    // BYOK key from request, or fall back to server key
    const key = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!key) {
      return NextResponse.json(
        {
          error:
            "No API key. Enter your Anthropic API key above, or contact us for access.",
        },
        { status: 422 }
      );
    }

    const client = new Anthropic({ apiKey: key });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Review this SuiteScript code:\n\n\`\`\`javascript\n${code}\n\`\`\``,
        },
      ],
    });

    const responseText = message.content[0].text;

    // Parse JSON — handle markdown code fences
    let review;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      review = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse review response", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review,
      source: apiKey ? "your-key" : "server",
    });
  } catch (error) {
    console.error("[ScriptGuard] Error:", error);

    if (
      error?.status === 401 ||
      error?.message?.includes("invalid x-api-key")
    ) {
      return NextResponse.json(
        { error: "Invalid API key. Check your Anthropic API key." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
