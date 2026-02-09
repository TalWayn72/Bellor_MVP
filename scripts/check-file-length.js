#!/usr/bin/env node

/**
 * File Length Checker - enforces max 150 lines per file
 * Exempt: test files, Radix UI wrappers, Prisma schema/seed, e2e fixtures,
 *         test setup, entry points, node_modules, dist, build, .prisma
 * Run: node scripts/check-file-length.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const MAX_LINES = 150;

const SCAN_DIRS = ['apps', 'packages'].map(d => path.join(rootDir, d));
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'coverage', '.prisma', 'seed-data', 'migration',
]);

function isExempt(filePath) {
  const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const base = path.basename(filePath);
  if (/\.(test|spec)\.[jt]sx?$/.test(base)) return true;
  if (/\.(config)\.[jt]sx?$/.test(base)) return true;
  if (rel.startsWith('apps/web/src/components/ui/')) return true;
  if (base === 'schema.prisma') return true;
  if (rel.includes('e2e/fixtures.ts')) return true;
  if (rel.includes('test/setup.ts')) return true;
  if (rel.includes('prisma/seed.ts')) return true;
  return false;
}

function collectFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function padEnd(str, len) {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function padStart(str, len) {
  return str.length >= len ? str : ' '.repeat(len - str.length) + str;
}

function run() {
  const allFiles = SCAN_DIRS.flatMap(d => collectFiles(d));
  const violations = [];

  for (const file of allFiles) {
    if (isExempt(file)) continue;
    const lines = countLines(file);
    if (lines > MAX_LINES) {
      const rel = path.relative(rootDir, file).replace(/\\/g, '/');
      violations.push({ file: rel, lines, over: lines - MAX_LINES });
    }
  }

  const total = allFiles.length;
  const checked = allFiles.filter(f => !isExempt(f)).length;

  console.log(`\nFile Length Check (max ${MAX_LINES} lines)`);
  console.log(`Scanned: ${checked} files (${total} total, ${total - checked} exempt)\n`);

  if (violations.length === 0) {
    console.log('All files are within the 150-line limit.\n');
    process.exit(0);
  }

  violations.sort((a, b) => b.over - a.over);

  const colFile = Math.min(70, Math.max(20, ...violations.map(v => v.file.length)));
  const sep = '-'.repeat(colFile + 20);

  console.log(`${padEnd('File', colFile)}  Lines   Over`);
  console.log(sep);
  for (const v of violations) {
    const f = padEnd(v.file, colFile);
    const l = padStart(String(v.lines), 5);
    const o = padStart(`+${v.over}`, 6);
    console.log(`${f}  ${l}  ${o}`);
  }
  console.log(sep);
  console.log(`\n${violations.length} file(s) exceed ${MAX_LINES} lines.\n`);
  process.exit(1);
}

run();
