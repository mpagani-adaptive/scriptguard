import * as vscode from 'vscode';
import { reviewCode } from './engine/reviewer';
import { enhanceReview } from './ai/enhancer';
import { getWebviewContent } from './webview';
import type { ReviewResult } from './types';

let currentPanel: vscode.WebviewPanel | null = null;

export function activate(context: vscode.ExtensionContext) {
  // Command: Review selected code
  context.subscriptions.push(
    vscode.commands.registerCommand('suitelens.reviewCode', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor.');
        return;
      }
      const selection = editor.selection;
      const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
      runReview(code, context, editor);
    })
  );

  // Command: Review entire file
  context.subscriptions.push(
    vscode.commands.registerCommand('suitelens.reviewFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor.');
        return;
      }
      runReview(editor.document.getText(), context, editor);
    })
  );
}

async function runReview(
  code: string,
  context: vscode.ExtensionContext,
  editor: vscode.TextEditor,
) {
  if (!code.trim()) {
    vscode.window.showWarningMessage('No code to review.');
    return;
  }

  if (code.length > 100000) {
    vscode.window.showWarningMessage('Code exceeds 100,000 character limit.');
    return;
  }

  const panel = getOrCreatePanel(context);
  panel.webview.postMessage({ type: 'loading' });

  try {
    // Step 1: Static analysis (instant, no API needed)
    const staticResult = reviewCode(code);

    // Show static results immediately
    panel.webview.postMessage({ type: 'review', result: staticResult });

    // Step 2: Optional AI enhancement
    const config = vscode.workspace.getConfiguration('suitelens');
    const aiEnabled = config.get<boolean>('enableAI', false);
    const apiKey = config.get<string>('anthropicApiKey', '');
    const model = config.get<string>('aiModel', 'claude-sonnet-4-20250514');

    if (aiEnabled && apiKey) {
      panel.webview.postMessage({ type: 'ai-loading' });
      try {
        const enhanced = await enhanceReview(code, staticResult, apiKey, model);
        panel.webview.postMessage({ type: 'review', result: enhanced });
      } catch (err: any) {
        const msg = err?.status === 401
          ? 'Invalid API key. Check your Anthropic API key in settings.'
          : `AI enhancement failed: ${err.message || 'Unknown error'}`;
        panel.webview.postMessage({ type: 'ai-error', message: msg });
      }
    }

    // Highlight problematic lines in the editor
    highlightFindings(staticResult, editor);
  } catch (err: any) {
    panel.webview.postMessage({
      type: 'error',
      message: err.message || 'Review failed.',
    });
  }
}

// Diagnostics collection for inline highlighting
const diagnosticCollection = vscode.languages.createDiagnosticCollection('suitelens');

function highlightFindings(result: ReviewResult, editor: vscode.TextEditor) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const finding of result.findings) {
    if (!finding.line) continue;

    const lineIdx = finding.line - 1;
    if (lineIdx < 0 || lineIdx >= editor.document.lineCount) continue;

    const lineText = editor.document.lineAt(lineIdx);
    const range = new vscode.Range(lineIdx, 0, lineIdx, lineText.text.length);

    const severity =
      finding.severity === 'critical' ? vscode.DiagnosticSeverity.Error :
      finding.severity === 'warning' ? vscode.DiagnosticSeverity.Warning :
      vscode.DiagnosticSeverity.Information;

    const diag = new vscode.Diagnostic(range, `[SuiteLens] ${finding.title}: ${finding.issue}`, severity);
    diag.source = 'SuiteLens';
    diagnostics.push(diag);
  }

  diagnosticCollection.set(editor.document.uri, diagnostics);
}

function getOrCreatePanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside);
    return currentPanel;
  }

  const panel = vscode.window.createWebviewPanel(
    'suitelensReview',
    'SuiteLens Review',
    vscode.ViewColumn.Beside,
    { enableScripts: true },
  );

  panel.webview.html = getWebviewContent();
  panel.onDidDispose(() => { currentPanel = null; });

  currentPanel = panel;
  return panel;
}

export function deactivate() {
  diagnosticCollection.dispose();
}
