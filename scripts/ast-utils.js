#!/usr/bin/env node

/**
 * AST utility functions for memory leak detection
 */

import ts from 'typescript';

/**
 * Check if a function body has a return statement
 */
export function hasReturnStatement(body) {
  let hasReturn = false;

  function visit(node) {
    if (ts.isReturnStatement(node)) {
      hasReturn = true;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(body);
  return hasReturn;
}

/**
 * Check if useEffect has side effects that need cleanup
 */
export function checkForSideEffects(body) {
  let hasSideEffects = false;

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      // setInterval, setTimeout, addEventListener
      if (ts.isIdentifier(expression)) {
        if (['setInterval', 'setTimeout'].includes(expression.text)) {
          hasSideEffects = true;
        }
      }

      // addEventListener, .on()
      if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name)) {
        if (['addEventListener', 'on'].includes(expression.name.text)) {
          hasSideEffects = true;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(body);
  return hasSideEffects;
}

/**
 * Track patterns in the AST
 */
export function createTrackers() {
  return {
    intervals: [],
    cleanups: [],
    eventListeners: [],
    eventRemovals: [],
    onCalls: [],
    offCalls: [],
    unsubVariables: new Set()
  };
}

/**
 * Track variable declarations that store .on() return values
 */
export function trackUnsubVariables(node, trackers) {
  if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
    const call = node.initializer;
    if (ts.isPropertyAccessExpression(call.expression) &&
        ts.isIdentifier(call.expression.name) &&
        call.expression.name.text === 'on') {
      const varName = ts.isIdentifier(node.name) ? node.name.text : '';
      if (varName.startsWith('unsub') || varName.includes('Unsub')) {
        trackers.unsubVariables.add(varName);
      }
    }
  }
}

/**
 * Track call expressions for various patterns
 */
export function trackCallExpressions(node, sourceFile, trackers) {
  if (!ts.isCallExpression(node)) return;

  const expression = node.expression;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  // Track setInterval
  if (ts.isIdentifier(expression) && expression.text === 'setInterval') {
    trackers.intervals.push({ line, node });
  }

  // Track clearInterval
  if (ts.isIdentifier(expression) && expression.text === 'clearInterval') {
    trackers.cleanups.push({ line });
  }

  // Track addEventListener
  if (ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'addEventListener') {
    trackers.eventListeners.push({ line });
  }

  // Track removeEventListener
  if (ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'removeEventListener') {
    trackers.eventRemovals.push({ line });
  }

  // Track .on() calls
  if (ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'on') {
    const objectName = ts.isIdentifier(expression.expression) ? expression.expression.text : '';
    const eventArg = node.arguments[0];
    const eventName = ts.isStringLiteral(eventArg) ? eventArg.text : '';

    const isServerLevel = ['io', 'process', 'server', 'socket'].includes(objectName);
    const isLifecycleEvent = ['connect', 'disconnect', 'error', 'connect_error', 'reconnect'].includes(eventName);

    if (!isServerLevel && !isLifecycleEvent) {
      trackers.onCalls.push({ line, object: objectName, event: eventName });
    }
  }

  // Track .off() calls
  if (ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'off') {
    trackers.offCalls.push({ line });
  }
}
