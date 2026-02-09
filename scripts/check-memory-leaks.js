#!/usr/bin/env node

/**
 * Memory Leak Detection Script
 * Scans codebase for common memory leak patterns using AST parsing
 * Run with: node scripts/check-memory-leaks.js [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeFile } from './memory-leak-ast-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const verbose = process.argv.includes('--verbose');

const results = {
  totalFiles: 0,
  scannedFiles: 0,
  issues: []
};

/**
 * Scan a single file for memory leak patterns
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(rootDir, filePath);
    const issues = analyzeFile(content, relativePath, verbose);

    return issues.map(issue => ({
      file: relativePath,
      pattern: issue.pattern,
      severity: issue.severity,
      occurrences: issue.occurrences,
      line: issue.line
    }));
  } catch (error) {
    if (verbose) {
      console.log(`  ⚠️  Error scanning ${filePath}: ${error.message}`);
    }
    return [];
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanDirectory(filePath, extensions);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.totalFiles++;
      const issues = scanFile(filePath);
      if (issues.length > 0) {
        results.scannedFiles++;
        results.issues.push(...issues);
      }
    }
  });
}

/**
 * Generate summary report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('Memory Leak Detection Report');
  console.log('='.repeat(60) + '\n');

  console.log(`Total files scanned: ${results.totalFiles}`);
  console.log(`Files with potential issues: ${results.scannedFiles}\n`);

  if (results.issues.length === 0) {
    console.log('✅ No memory leak patterns detected!\n');
    return 0;
  }

  const bySeverity = results.issues.reduce((acc, issue) => {
    acc[issue.severity] = acc[issue.severity] || [];
    acc[issue.severity].push(issue);
    return acc;
  }, {});

  ['HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
    if (bySeverity[severity]) {
      console.log(`\n${'🔴'.repeat(severity === 'HIGH' ? 3 : severity === 'MEDIUM' ? 2 : 1)} ${severity} SEVERITY (${bySeverity[severity].length} issues):`);
      console.log('-'.repeat(60));

      bySeverity[severity].forEach(issue => {
        console.log(`  📁 ${issue.file}:${issue.line}`);
        console.log(`     Pattern: ${issue.pattern}`);
        console.log(`     Occurrences: ${issue.occurrences}`);
        console.log('');
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total issues found: ${results.issues.length}`);
  console.log('='.repeat(60) + '\n');

  return results.issues.filter(i => i.severity === 'HIGH').length > 0 ? 1 : 0;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning codebase for memory leak patterns (AST mode)...\n');

  if (verbose) {
    console.log('Verbose mode enabled\n');
  }

  const apiDir = path.join(rootDir, 'apps', 'api', 'src');
  if (fs.existsSync(apiDir)) {
    console.log('Scanning backend (apps/api/src)...');
    scanDirectory(apiDir, ['.ts', '.js']);
  }

  const webDir = path.join(rootDir, 'apps', 'web', 'src');
  if (fs.existsSync(webDir)) {
    console.log('Scanning frontend (apps/web/src)...');
    scanDirectory(webDir, ['.ts', '.tsx', '.js', '.jsx']);
  }

  const exitCode = generateReport();
  process.exit(exitCode);
}

main();
