#!/usr/bin/env node

/**
 * Build URL Checker - detects Mixed Content risks in production builds.
 * Scans dist JS files for hardcoded HTTP URLs that would cause Mixed Content
 * errors when served over HTTPS.
 *
 * Run: node scripts/check-build-urls.js
 * Exit code: 0 = clean, 1 = issues found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'apps', 'web', 'dist', 'assets');

// HTTP URLs that are OK (not Mixed Content risks)
const ALLOWED_HTTP = [
  'http://localhost',
  'http://127.0.0.1',
  'http://www.w3.org',
  'http://fb.me',
  'http://reactjs.org',
];

function isAllowed(url) {
  return ALLOWED_HTTP.some((prefix) => url.startsWith(prefix));
}

function checkBuild() {
  if (!fs.existsSync(distDir)) {
    console.log('No dist directory found. Run build first.');
    process.exit(0);
  }

  const files = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'));
  const issues = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(distDir, file), 'utf-8');
    const httpUrls = content.match(/http:\/\/[^"'\s)]+/g) || [];

    for (const url of httpUrls) {
      if (!isAllowed(url)) {
        issues.push({ file, url });
      }
    }
  }

  if (issues.length === 0) {
    console.log(`\nBuild URL Check: ${files.length} JS files scanned - CLEAN`);
    console.log('No Mixed Content risks detected.\n');
    process.exit(0);
  }

  console.error(`\nBuild URL Check: ${issues.length} Mixed Content risk(s) found!\n`);
  for (const { file, url } of issues) {
    console.error(`  ${file}: ${url}`);
  }
  console.error('\nFix: Ensure VITE_API_URL uses https:// for production builds.\n');
  process.exit(1);
}

checkBuild();
