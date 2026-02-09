#!/usr/bin/env node

/**
 * AST-based Memory Leak Analyzer
 * Uses TypeScript compiler API to parse code and detect memory leaks
 */

import ts from 'typescript';
import {
  hasReturnStatement,
  checkForSideEffects,
  createTrackers,
  trackUnsubVariables,
  trackCallExpressions
} from './ast-utils.js';

/**
 * Analyze a file using AST parsing
 */
export function analyzeFile(content, filePath, verbose = false) {
  const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const issues = [];
  const trackers = createTrackers();

  function visit(node) {
    trackUnsubVariables(node, trackers);
    trackCallExpressions(node, sourceFile, trackers);

    // Check useEffect hooks
    if (ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'useEffect') {
      const effectCallback = node.arguments[0];

      if (effectCallback && ts.isArrowFunction(effectCallback)) {
        const hasCleanup = hasReturnStatement(effectCallback.body);
        const hasSideEffects = checkForSideEffects(effectCallback.body);

        if (hasSideEffects && !hasCleanup) {
          issues.push({
            pattern: 'useEffect without cleanup return',
            severity: isTestFile ? 'LOW' : 'MEDIUM',
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            occurrences: 1
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Check setInterval balance
  if (trackers.intervals.length > 0 && trackers.cleanups.length === 0) {
    issues.push({
      pattern: 'setInterval without clearInterval',
      severity: isTestFile ? 'LOW' : 'HIGH',
      line: trackers.intervals[0].line,
      occurrences: trackers.intervals.length
    });
  }

  // Check addEventListener balance
  if (trackers.eventListeners.length > 0 &&
      trackers.eventRemovals.length < trackers.eventListeners.length) {
    issues.push({
      pattern: 'addEventListener without removeEventListener',
      severity: isTestFile ? 'LOW' : 'HIGH',
      line: trackers.eventListeners[0].line,
      occurrences: trackers.eventListeners.length - trackers.eventRemovals.length
    });
  }

  // Check .on()/.off() balance (ignore if using unsub pattern)
  if (trackers.onCalls.length > 0 &&
      trackers.offCalls.length < trackers.onCalls.length &&
      trackers.unsubVariables.size === 0) {
    issues.push({
      pattern: 'Event emitter .on() without .off()',
      severity: isTestFile ? 'LOW' : 'HIGH',
      line: trackers.onCalls[0].line,
      occurrences: trackers.onCalls.length - trackers.offCalls.length
    });
  }

  if (verbose && issues.length > 0) {
    console.log(`  [AST] Found ${issues.length} issues in ${filePath}`);
  }

  return issues;
}
