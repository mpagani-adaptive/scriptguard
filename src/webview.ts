/**
 * Returns the HTML content for the SuiteLens review panel.
 * Uses VS Code's CSS variables for native theme integration.
 */
export function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family, system-ui);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    padding: 16px;
    line-height: 1.5;
  }

  .header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .header h1 { font-size: 16px; font-weight: 700; }
  .header .badge {
    font-size: 11px; font-weight: 700; padding: 2px 8px;
    border-radius: 10px; text-transform: uppercase;
  }

  .loading {
    display: flex; align-items: center; gap: 8px;
    color: var(--vscode-descriptionForeground);
    padding: 24px 0;
  }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid var(--vscode-descriptionForeground);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-box {
    background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    border: 1px solid var(--vscode-inputValidation-errorBorder, #be1100);
    padding: 12px; border-radius: 6px; margin: 12px 0;
  }
  .ai-note {
    background: var(--vscode-inputValidation-infoBackground, #1a3a5a);
    border: 1px solid var(--vscode-inputValidation-infoBorder, #007acc);
    padding: 8px 12px; border-radius: 6px; margin: 8px 0;
    font-size: 12px;
  }

  .risk-CRITICAL, .sev-critical { background: #7a1d1d; color: #ff6b6b; }
  .risk-HIGH { background: #5a1d1d; color: #f87171; }
  .risk-MEDIUM { background: #5a3e1d; color: #fbbf24; }
  .risk-LOW { background: #1d3a2a; color: #4ade80; }
  .sev-warning { background: #5a3e1d; color: #fbbf24; }
  .sev-suggestion { background: #1d3050; color: #60a5fa; }

  .summary-box {
    background: var(--vscode-editor-inactiveSelectionBackground, #2a2d2e);
    border-radius: 8px; padding: 14px; margin: 12px 0;
  }
  .summary-text { font-size: 13px; margin-top: 6px; }
  .meta { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 6px; }

  .finding {
    border: 1px solid var(--vscode-panel-border, #3c3c3c);
    border-radius: 8px; padding: 12px; margin-bottom: 8px;
  }
  .finding-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 8px; gap: 8px;
  }
  .finding-title { font-weight: 700; font-size: 13px; }
  .badges { display: flex; gap: 4px; flex-shrink: 0; }
  .badge {
    font-size: 10px; font-weight: 700; padding: 2px 8px;
    border-radius: 10px; text-transform: uppercase; white-space: nowrap;
  }
  .cat-badge {
    background: var(--vscode-badge-background, #333);
    color: var(--vscode-badge-foreground, #ccc);
  }
  .line-ref {
    font-size: 11px; color: var(--vscode-textLink-foreground, #3794ff);
    cursor: pointer; text-decoration: underline;
  }

  .field { margin-top: 8px; }
  .field-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    color: var(--vscode-descriptionForeground); margin-bottom: 2px;
    letter-spacing: 0.5px;
  }
  .field-value { font-size: 12px; }
  .evidence {
    background: var(--vscode-textCodeBlock-background, #1e1e1e);
    padding: 6px 8px; border-radius: 4px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 11px; white-space: pre-wrap; margin-top: 2px;
    border-left: 3px solid var(--vscode-descriptionForeground);
  }

  .section-title { font-size: 13px; font-weight: 700; margin: 16px 0 8px; }
  .count-label { font-weight: 400; color: var(--vscode-descriptionForeground); }

  #initial {
    text-align: center; padding: 40px 16px;
    color: var(--vscode-descriptionForeground);
  }
  #initial h1 { font-size: 18px; color: var(--vscode-foreground); margin-bottom: 4px; }
  #initial p { font-size: 12px; margin-top: 8px; line-height: 1.6; }
  .clean-result {
    text-align: center; padding: 32px;
    color: #4ade80;
  }
  .clean-result .check { font-size: 40px; margin-bottom: 8px; }
</style>
</head>
<body>
  <div id="initial">
    <h1>SuiteLens</h1>
    <p>Select SuiteScript code → right-click → <strong>Review Selected Code</strong><br>
    or use the Command Palette: <strong>SuiteLens: Review Selected Code</strong></p>
  </div>
  <div id="loading" style="display:none">
    <div class="loading"><div class="spinner"></div> Running static analysis...</div>
  </div>
  <div id="ai-loading" style="display:none">
    <div class="ai-note">Enhancing with AI analysis...</div>
  </div>
  <div id="error" style="display:none"></div>
  <div id="results" style="display:none"></div>

  <script>
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (event) => {
      const msg = event.data;

      if (msg.type === "loading") {
        hide("initial"); hide("results"); hide("error"); hide("ai-loading");
        show("loading");
      } else if (msg.type === "ai-loading") {
        show("ai-loading");
      } else if (msg.type === "error") {
        hide("loading"); hide("ai-loading");
        const el = document.getElementById("error");
        el.innerHTML = '<div class="error-box">' + esc(msg.message) + '</div>';
        show("error");
      } else if (msg.type === "ai-error") {
        hide("ai-loading");
        const el = document.getElementById("error");
        el.innerHTML = '<div class="ai-note" style="border-color:#be1100;background:#3a1d1d">' + esc(msg.message) + '</div>';
        show("error");
      } else if (msg.type === "review") {
        hide("loading"); hide("ai-loading"); hide("error"); hide("initial");
        renderReview(msg.result);
        show("results");
      }
    });

    function renderReview(r) {
      const el = document.getElementById("results");
      let html = "";

      // Header
      html += '<div class="header">';
      html += '<h1>SuiteLens Review</h1>';
      html += '<span class="badge risk-' + r.riskLevel + '">' + r.riskLevel + ' RISK</span>';
      if (r.aiEnhanced) html += '<span class="badge" style="background:#1a3a5a;color:#60a5fa">AI Enhanced</span>';
      html += '</div>';

      // Summary
      html += '<div class="summary-box">';
      html += '<div class="summary-text">' + esc(r.summary) + '</div>';
      if (r.scriptType) html += '<div class="meta">Detected: ' + esc(r.scriptType) + ' script</div>';
      html += '</div>';

      if (r.findings.length === 0) {
        html += '<div class="clean-result"><div class="check">&#10003;</div><strong>No issues found</strong></div>';
        el.innerHTML = html;
        return;
      }

      // Group by severity
      const critical = r.findings.filter(f => f.severity === "critical");
      const warnings = r.findings.filter(f => f.severity === "warning");
      const suggestions = r.findings.filter(f => f.severity === "suggestion");

      if (critical.length) {
        html += '<div class="section-title">Critical <span class="count-label">(' + critical.length + ')</span></div>';
        critical.forEach(f => html += renderFinding(f));
      }
      if (warnings.length) {
        html += '<div class="section-title">Warnings <span class="count-label">(' + warnings.length + ')</span></div>';
        warnings.forEach(f => html += renderFinding(f));
      }
      if (suggestions.length) {
        html += '<div class="section-title">Suggestions <span class="count-label">(' + suggestions.length + ')</span></div>';
        suggestions.forEach(f => html += renderFinding(f));
      }

      el.innerHTML = html;
    }

    function renderFinding(f) {
      let html = '<div class="finding">';
      html += '<div class="finding-header">';
      html += '<span class="finding-title">' + esc(f.title) + '</span>';
      html += '<div class="badges">';
      html += '<span class="badge sev-' + f.severity + '">' + f.severity + '</span>';
      html += '<span class="badge cat-badge">' + esc(f.category) + '</span>';
      html += '</div></div>';

      if (f.line) {
        html += '<span class="line-ref">Line ' + f.line + '</span>';
      }

      html += '<div class="field"><div class="field-label">Issue</div>';
      html += '<div class="field-value">' + esc(f.issue) + '</div></div>';

      if (f.evidence) {
        html += '<div class="field"><div class="field-label">Evidence</div>';
        html += '<div class="evidence">' + esc(f.evidence) + '</div></div>';
      }

      html += '<div class="field"><div class="field-label">Why It Matters</div>';
      html += '<div class="field-value">' + esc(f.whyItMatters) + '</div></div>';

      html += '<div class="field"><div class="field-label">Recommendation</div>';
      html += '<div class="field-value">' + esc(f.recommendation) + '</div></div>';

      html += '</div>';
      return html;
    }

    function esc(s) {
      const d = document.createElement("div");
      d.textContent = s || "";
      return d.innerHTML;
    }
    function show(id) { document.getElementById(id).style.display = "block"; }
    function hide(id) { document.getElementById(id).style.display = "none"; }
  </script>
</body>
</html>`;
}
