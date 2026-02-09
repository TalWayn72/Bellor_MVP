/**
 * Scripts barrel file - exports all script utilities
 */

export { analyzeFile } from './memory-leak-ast-analyzer.js';
export {
  hasReturnStatement,
  checkForSideEffects,
  createTrackers,
  trackUnsubVariables,
  trackCallExpressions
} from './ast-utils.js';
