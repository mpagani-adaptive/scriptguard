"use client";

import { useState, useEffect } from "react";

const SEVERITY_COLORS = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const RISK_COLORS = {
  HIGH: "text-red-400",
  MEDIUM: "text-amber-400",
  LOW: "text-green-400",
};

const CATEGORY_COLORS = {
  GOVERNANCE: "bg-purple-500/20 text-purple-400",
  PERFORMANCE: "bg-orange-500/20 text-orange-400",
  ERROR_HANDLING: "bg-red-500/20 text-red-400",
  MAINTAINABILITY: "bg-slate-500/20 text-slate-400",
  SECURITY: "bg-rose-500/20 text-rose-400",
  SCRIPT_DESIGN: "bg-cyan-500/20 text-cyan-400",
};

const SAMPLE_CODE = `/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/https'], (record, search, https) => {

  const afterSubmit = (context) => {
    let salesOrder = context.newRecord;

    // Validate every line with external API
    for (let i = 0; i < salesOrder.getLineCount({ sublistId: 'item' }); i++) {
      let itemId = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });

      let response = https.get({
        url: 'https://api.vendor.com/validate?item=' + itemId
      });

      if (response.code !== 200) {
        log.debug('Validation failed', 'Item ' + itemId);
      }
    }

    // Update custom field
    record.submitFields({
      type: record.Type.SALES_ORDER,
      id: salesOrder.id,
      values: { custbody_validated: true }
    });

    // Send to integration
    let customerId = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: 1234,
      columns: ['email']
    });
  };

  return { afterSubmit };
});`;

export default function Home() {
  const [code, setCode] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);

  // Persist API key in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("scriptguard_api_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("scriptguard_api_key", apiKey);
    } else {
      localStorage.removeItem("scriptguard_api_key");
    }
  }, [apiKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          ...(apiKey ? { apiKey } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Review failed");
      }

      setReview(data.review);
      setSource(data.source);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setCode(SAMPLE_CODE);
    setReview(null);
    setError(null);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">ScriptGuard</span>
          </div>
          <a
            href="https://adaptivesuitesolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            by Adaptive Solutions Group
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Paste your SuiteScript.
            <br />
            <span className="text-emerald-400">
              Get a production-grade review.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Governance risks. Performance problems. Security gaps. Anti-patterns.
            Found in seconds, not sprints.
          </p>
        </div>

        {/* API Key */}
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-400 whitespace-nowrap">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-... (saved in your browser, never stored on our servers)"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-[family-name:var(--font-geist-mono)]"
            />
            {apiKey && (
              <button
                onClick={() => setApiKey("")}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Your key stays in your browser. It&apos;s sent directly to
            the Anthropic API — we don&apos;t log or store it.{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:underline"
            >
              Get a key
            </a>
          </p>
        </div>

        {/* Code Input */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-400">
                SuiteScript Code
              </label>
              <button
                type="button"
                onClick={loadSample}
                className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Load sample script
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your SuiteScript here..."
              className="w-full h-80 p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-500 resize-y font-[family-name:var(--font-geist-mono)]"
              spellCheck={false}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-600">
                {code.length.toLocaleString()} / 50,000 characters
              </p>
              {source && (
                <p className="text-xs text-slate-600">
                  {source === "your-key"
                    ? "Using your API key"
                    : "Using ScriptGuard API"}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Reviewing...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                Review Code
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {review && (
          <div className="mt-10 space-y-6">
            {/* Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Review Results
                </h2>
                <span
                  className={`text-lg font-bold ${RISK_COLORS[review.risk_level] || "text-slate-400"}`}
                >
                  {review.risk_level} RISK
                </span>
              </div>
              <p className="text-slate-300 text-lg">{review.summary}</p>
            </div>

            {/* Findings */}
            {review.findings && review.findings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Findings ({review.findings.length})
                </h3>
                {review.findings.map((finding, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-bold text-white">{finding.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SEVERITY_COLORS[finding.severity] || ""}`}
                        >
                          {finding.severity}
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[finding.category] || "bg-slate-800 text-slate-400"}`}
                        >
                          {finding.category}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-400 mb-1">
                          Evidence
                        </p>
                        <p className="text-slate-300 bg-slate-800/50 p-3 rounded-lg font-[family-name:var(--font-geist-mono)] text-xs">
                          {finding.evidence}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-400 mb-1">
                          Why It Matters
                        </p>
                        <p className="text-slate-300">
                          {finding.why_it_matters}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-400 mb-1">
                          Suggested Fix
                        </p>
                        <p className="text-slate-300">
                          {finding.suggested_fix}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Governance Assessment */}
            {review.governance_assessment && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-white">
                    Governance Assessment
                  </h3>
                  <span
                    className={`text-sm font-bold ${RISK_COLORS[review.governance_assessment.estimated_risk] || ""}`}
                  >
                    {review.governance_assessment.estimated_risk}
                  </span>
                </div>
                <p className="text-slate-300">
                  {review.governance_assessment.notes}
                </p>
              </div>
            )}

            {/* Review Note */}
            {review.review_note && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-2">
                  Senior Reviewer Note
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {review.review_note}
                </p>
              </div>
            )}
          </div>
        )}

        {/* What It Checks — shown when no results */}
        {!review && !loading && (
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Governance Risk",
                description:
                  "Governance limit violations, scripts that will fail under production volume, Map/Reduce and Scheduled Script exhaustion patterns.",
                color: "text-purple-400",
              },
              {
                title: "Performance",
                description:
                  "Save-time external API calls, unnecessary search loads, record.load inside loops, heavy User Event logic that blocks users.",
                color: "text-orange-400",
              },
              {
                title: "Security",
                description:
                  "Hardcoded internal IDs, credential exposure, open endpoints, missing input validation, unsafe eval patterns.",
                color: "text-rose-400",
              },
              {
                title: "Error Handling",
                description:
                  "Missing try/catch on API calls, silent failures, no logging on errors, unhandled promise rejections.",
                color: "text-red-400",
              },
              {
                title: "Script Design",
                description:
                  "Anti-patterns, wrong script types for the job, unnecessary triggers, context-unaware execution.",
                color: "text-cyan-400",
              },
              {
                title: "Maintainability",
                description:
                  "Orphaned code, unclear naming, magic numbers, undocumented dependencies, copy-paste patterns.",
                color: "text-slate-400",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6"
              >
                <h3 className={`font-bold mb-2 ${item.color}`}>
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} Adaptive Solutions Group. All
            rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://adaptivesuitesolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              NetSuite Consulting
            </a>
            <a
              href="https://healthcheck.adsg.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-400 transition-colors"
            >
              SuiteRX Environment Scanner
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
