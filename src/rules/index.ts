import type { Rule } from '../types';
import { recordLoadInLoop } from './recordLoadInLoop';
import { searchInLoop } from './searchInLoop';
import { heavyUserEvent } from './heavyUserEvent';
import { fullRecordSave } from './fullRecordSave';
import { noIdempotency } from './noIdempotency';
import { apiCallInLoop } from './apiCallInLoop';
import { unboundedSearch } from './unboundedSearch';
import { hardcodedIds } from './hardcodedIds';
import { missingErrorHandling } from './missingErrorHandling';
import { dynamicModeAbuse } from './dynamicModeAbuse';

export const ALL_RULES: Rule[] = [
  recordLoadInLoop,
  searchInLoop,
  heavyUserEvent,
  fullRecordSave,
  noIdempotency,
  apiCallInLoop,
  unboundedSearch,
  hardcodedIds,
  missingErrorHandling,
  dynamicModeAbuse,
];
