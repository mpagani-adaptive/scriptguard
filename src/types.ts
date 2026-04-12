export type Severity = 'critical' | 'warning' | 'suggestion';

export type Category =
  | 'governance'
  | 'performance'
  | 'reliability'
  | 'security'
  | 'architecture'
  | 'error-handling'
  | 'maintainability'
  | 'anti-pattern';

export interface Finding {
  ruleId: string;
  severity: Severity;
  category: Category;
  title: string;
  issue: string;
  whyItMatters: string;
  recommendation: string;
  line?: number;
  endLine?: number;
  evidence?: string;
}

export interface ReviewResult {
  findings: Finding[];
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scriptType?: string;
  aiEnhanced: boolean;
}

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  category: Category;
  detect: (context: RuleContext) => Finding[];
}

export interface RuleContext {
  code: string;
  ast: any;
  lines: string[];
  scriptType: string | null;
  scriptVersion: string | null;
  entryPoints: string[];
}
