"use client";

const FINDINGS_DEMO = [
  { severity: "critical", title: "Record Load Inside Loop", line: 24, category: "GOVERNANCE" },
  { severity: "critical", title: "API Call Inside Loop (N+1)", line: 15, category: "PERFORMANCE" },
  { severity: "critical", title: "HTTP Calls in User Event", line: 7, category: "ARCHITECTURE" },
  { severity: "warning", title: "Full Record Save for Field Update", line: 44, category: "GOVERNANCE" },
  { severity: "warning", title: "Hardcoded Internal IDs", line: 30, category: "MAINTAINABILITY" },
  { severity: "suggestion", title: "Unnecessary Dynamic Mode", line: 24, category: "PERFORMANCE" },
];

const SEV_STYLES = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  suggestion: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">SuiteLens</span>
          </div>
          <a href="https://adaptivesuitesolutions.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            by Adaptive Solutions Group
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 font-medium">
            VS Code Extension
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Review SuiteScript
            <br />
            <span className="text-blue-400">without leaving your editor.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Highlight code. Click Review. Get production-focused findings on
            governance risks, performance anti-patterns, and scalability failures — in seconds. No API key required.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://marketplace.visualstudio.com/items?itemName=adaptive-solutions-group.suitelens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.583 2L6.186 7.992 2 5.635v12.73l4.186-2.357 11.397 5.992L22 19.635V4.365L17.583 2zm-.583 3.368v13.264l-8-4.203V7.571l8-4.203v2z" />
              </svg>
              Install from Marketplace
            </a>
            <a
              href="https://github.com/mpagani-adaptive/scriptguard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-lg border border-slate-700"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* Live Demo Preview */}
        <div className="mb-20 max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Fake VS Code title bar */}
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
              </div>
              <span className="text-xs text-slate-400 ml-2">SuiteLens Review — afterSubmit.js</span>
            </div>
            {/* Mock findings panel */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-white">SuiteLens Review</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400">CRITICAL RISK</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                This UserEvent script has 3 critical issues that will fail in production, 2 warnings, 1 suggestion.
              </p>
              <div className="space-y-2">
                {FINDINGS_DEMO.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_STYLES[f.severity]}`}>
                        {f.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-slate-200">{f.title}</span>
                    </div>
                    <span className="text-xs text-slate-500">Line {f.line}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-4 text-center">
                Real output from SuiteLens static analysis — no API key needed
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Three steps. Zero context-switching.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Highlight your code",
                description: "Select a SuiteScript block — a function, a full file, or just the lines you're worried about.",
              },
              {
                step: "2",
                title: "Right-click → Review",
                description: "Click \"SuiteLens: Review Selected Code\" from the context menu, or use the Command Palette.",
              },
              {
                step: "3",
                title: "Get findings instantly",
                description: "A side panel shows risk level, categorized findings with evidence, and concrete recommendations.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Static Engine Highlight */}
        <div className="mb-20 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Not a wrapper around AI.
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            SuiteLens has a real static analysis engine. It parses your code into an AST and runs
            10 production-focused rules — offline, instantly, with zero API calls. AI enhancement
            is optional, for when you want deeper architectural feedback.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-blue-400 mb-2 text-sm">STATIC ENGINE (always on)</h3>
              <ul className="text-sm text-slate-400 space-y-1.5">
                <li>AST parsing via acorn</li>
                <li>10 rule checks with real detection logic</li>
                <li>Works offline — no API key needed</li>
                <li>Instant results, zero cost</li>
                <li>Inline editor diagnostics</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-purple-400 mb-2 text-sm">AI LAYER (opt-in)</h3>
              <ul className="text-sm text-slate-400 space-y-1.5">
                <li>Enhances static findings — never replaces</li>
                <li>Catches architectural misfit</li>
                <li>Business logic risk analysis</li>
                <li>Uses your own Anthropic API key</li>
                <li>Claude Sonnet or Haiku</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What It Catches */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            What SuiteLens catches
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Governance Risk", description: "record.load() in loops, governance exhaustion patterns, API calls that blow limits at production volume.", color: "text-red-400" },
              { title: "Performance", description: "N+1 search patterns, unbounded result sets, heavy User Event logic that blocks saves and frustrates users.", color: "text-orange-400" },
              { title: "Reliability", description: "Missing idempotency on record creation, scripts that create duplicates on retry, no error handling on API calls.", color: "text-purple-400" },
              { title: "Security", description: "Hardcoded internal IDs that break across environments, credential exposure, unsafe patterns.", color: "text-rose-400" },
              { title: "Architecture", description: "Wrong script type for the job, heavy processing in User Events, logic that belongs in Map/Reduce.", color: "text-cyan-400" },
              { title: "Anti-Patterns", description: "Full record save where submitFields works, unnecessary dynamic mode, patterns that pass QA and fail at scale.", color: "text-slate-400" },
            ].map((item) => (
              <div key={item.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className={`font-bold mb-2 ${item.color}`}>{item.title}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Setup */}
        <div className="mb-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Setup in 60 seconds
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div>
                <p className="font-semibold text-white">Install the extension</p>
                <p className="text-sm text-slate-500">Search &quot;SuiteLens&quot; in VS Code Extensions, or install from the Marketplace link above.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div>
                <p className="font-semibold text-white">Start reviewing</p>
                <p className="text-sm text-slate-500">Highlight SuiteScript code, right-click, choose &quot;SuiteLens: Review Selected Code.&quot; Static analysis runs instantly — no setup needed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div>
                <p className="font-semibold text-white">Optional: Enable AI</p>
                <p className="text-sm text-slate-500">
                  For deeper analysis, add your Anthropic API key in VS Code Settings → SuiteLens.{" "}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Get a key</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mb-8">
          <a
            href="https://marketplace.visualstudio.com/items?itemName=adaptive-solutions-group.suitelens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg"
          >
            Install SuiteLens — Free
          </a>
          <p className="text-sm text-slate-600 mt-3">
            Static analysis works out of the box. No API key required.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} Adaptive Solutions Group. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://adaptivesuitesolutions.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
              NetSuite Consulting
            </a>
            <a href="https://healthcheck.adsg.cc" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
              SuiteRX Environment Scanner
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
