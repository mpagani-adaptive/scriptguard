import * as acorn from 'acorn';
import type { RuleContext } from '../types';

const SCRIPT_TYPE_MAP: Record<string, string> = {
  'UserEventScript': 'UserEvent',
  'ClientScript': 'Client',
  'Suitelet': 'Suitelet',
  'Restlet': 'Restlet',
  'ScheduledScript': 'Scheduled',
  'MapReduceScript': 'MapReduce',
  'MassUpdateScript': 'MassUpdate',
  'WorkflowActionScript': 'WorkflowAction',
  'BundleInstallationScript': 'BundleInstallation',
  'Portlet': 'Portlet',
};

const ENTRY_POINTS: Record<string, string[]> = {
  'UserEvent': ['beforeLoad', 'beforeSubmit', 'afterSubmit'],
  'Client': ['pageInit', 'fieldChanged', 'postSourcing', 'sublistChanged', 'lineInit', 'validateField', 'validateLine', 'validateInsert', 'validateDelete', 'saveRecord'],
  'Suitelet': ['onRequest'],
  'Restlet': ['get', 'post', 'put', 'delete'],
  'Scheduled': ['execute'],
  'MapReduce': ['getInputData', 'map', 'reduce', 'summarize'],
  'MassUpdate': ['each'],
  'WorkflowAction': ['onAction'],
  'Portlet': ['render'],
};

/**
 * Parse SuiteScript code into a RuleContext for analysis.
 * Uses acorn for AST parsing with fallback to regex for metadata extraction.
 */
export function parseCode(code: string): RuleContext {
  const lines = code.split('\n');
  let ast: any = null;

  // Parse AST — tolerant of SuiteScript patterns
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true,
      ranges: true,
      allowReturnOutsideFunction: true,
      // SuiteScript uses define() which is valid JS
    });
  } catch {
    // Try as script (not module) for older SuiteScript
    try {
      ast = acorn.parse(code, {
        ecmaVersion: 2020,
        sourceType: 'script',
        locations: true,
        ranges: true,
        allowReturnOutsideFunction: true,
      });
    } catch {
      // AST parsing failed — rules will use regex fallback
      ast = null;
    }
  }

  const scriptType = detectScriptType(code);
  const scriptVersion = detectScriptVersion(code);
  const entryPoints = detectEntryPoints(code, scriptType);

  return { code, ast, lines, scriptType, scriptVersion, entryPoints };
}

function detectScriptType(code: string): string | null {
  // Check JSDoc annotations: @NScriptType
  const match = code.match(/@NScriptType\s+(\w+)/);
  if (match && SCRIPT_TYPE_MAP[match[1]]) {
    return SCRIPT_TYPE_MAP[match[1]];
  }
  // Fallback: check for common entry point patterns
  if (/\bbeforeSubmit\b|\bafterSubmit\b|\bbeforeLoad\b/.test(code)) return 'UserEvent';
  if (/\bpageInit\b|\bfieldChanged\b|\bsaveRecord\b/.test(code)) return 'Client';
  if (/\bonRequest\b/.test(code) && /\brequest\b/.test(code) && /\bresponse\b/.test(code)) return 'Suitelet';
  if (/\bgetInputData\b/.test(code) && /\bmap\b/.test(code)) return 'MapReduce';
  if (/\bexecute\b/.test(code) && /@NScriptType/.test(code)) return 'Scheduled';
  return null;
}

function detectScriptVersion(code: string): string | null {
  const match = code.match(/@NApiVersion\s+([\d.]+)/);
  return match ? match[1] : null;
}

function detectEntryPoints(code: string, scriptType: string | null): string[] {
  if (!scriptType) return [];
  const possible = ENTRY_POINTS[scriptType] || [];
  return possible.filter(ep => {
    const regex = new RegExp(`\\b${ep}\\b\\s*[:=]|\\b${ep}\\b\\s*\\(`);
    return regex.test(code);
  });
}
