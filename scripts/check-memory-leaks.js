#!/usr/bin/env node

/**
 * Memory Leak Detection Script
 * Scans codebase for common memory leak patterns
 * Run with: node scripts/check-memory-leaks.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Memory leak patterns to detect
const LEAK_PATTERNS = [
  {
    name: 'setInterval without clearInterval',
    pattern: /setInterval\s*\([^)]+\)/g,
    cleanup: /clearInterval/g,
    severity: 'HIGH'
  },
  {
    name: 'setTimeout without cleanup in refs',
    pattern: /setTimeout\s*\([^)]+\)/g,
    cleanup: /clearTimeout/g,
    severity: 'MEDIUM',
    requiresContext: ['ref', 'useRef']
  },
  {
    name: 'addEventListener without removeEventListener',
    pattern: /addEventListener\s*\(/g,
    cleanup: /removeEventListener/g,
    severity: 'HIGH'
  },
  {
    name: 'Event emitter .on() without .off()',
    pattern: /\.on\s*\(/g,
    cleanup: /\.off\s*\(/g,
    severity: 'HIGH'
  },
  {
    name: 'useEffect without cleanup return',
    pattern: /useEffect\s*\(\s*\(\)\s*=>\s*{(?:[^{}]|{[^}]*})*}\s*,/g,
    cleanup: /return\s*\(\)\s*=>/g,
    severity: 'MEDIUM',
    fileTypes: ['.jsx', '.tsx']
  },
  {
    name: 'Map/Set without size management',
    pattern: /new\s+(Map|Set)\s*\(/g,
    cleanup: /(\.size|\.delete|MAX_SIZE)/g,
    severity: 'LOW'
  },
  {
    name: 'WebSocket without close in cleanup',
    pattern: /new\s+WebSocket\s*\(/g,
    cleanup: /\.close\s*\(/g,
    severity: 'HIGH'
  }
];

const results = {
  totalFiles: 0,
  scannedFiles: 0,
  issues: [],
  summary: {}
};

/**
 * Scan a single file for memory leak patterns
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(rootDir, filePath);
  const fileIssues = [];

  LEAK_PATTERNS.forEach(pattern => {
    // Check file type restrictions
    if (pattern.fileTypes && !pattern.fileTypes.some(ext => filePath.endsWith(ext))) {
      return;
    }

    const matches = content.match(pattern.pattern);
    if (matches && matches.length > 0) {
      const hasCleanup = pattern.cleanup.test(content);

      // Check context requirements
      let hasRequiredContext = true;
      if (pattern.requiresContext) {
        hasRequiredContext = pattern.requiresContext.some(ctx =>
          content.includes(ctx)
        );
      }

      if (!hasCleanup && hasRequiredContext) {
        fileIssues.push({
          file: relativePath,
          pattern: pattern.name,
          severity: pattern.severity,
          occurrences: matches.length,
          line: getLineNumber(content, matches[0])
        });
      }
    }
  });

  return fileIssues;
}

/**
 * Get line number of a match
 */
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n');
  return lines.length;
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
      // Skip node_modules, dist, build directories
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

  // Group by severity
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
  console.log('🔍 Scanning codebase for memory leak patterns...\n');

  // Scan backend
  const apiDir = path.join(rootDir, 'apps', 'api', 'src');
  if (fs.existsSync(apiDir)) {
    console.log('Scanning backend (apps/api/src)...');
    scanDirectory(apiDir, ['.ts', '.js']);
  }

  // Scan frontend
  const webDir = path.join(rootDir, 'apps', 'web', 'src');
  if (fs.existsSync(webDir)) {
    console.log('Scanning frontend (apps/web/src)...');
    scanDirectory(webDir, ['.ts', '.tsx', '.js', '.jsx']);
  }

  const exitCode = generateReport();
  process.exit(exitCode);
}

main();
