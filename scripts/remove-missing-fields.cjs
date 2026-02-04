#!/usr/bin/env node
/**
 * Remove references to fields that don't exist in schema
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../apps/api/src');

console.log('🧹 Removing references to missing schema fields...\n');

// Files to fix
const files = [
  'services/users.service.ts',
  'routes/v1/auth.routes.ts',
  'websocket/handlers/chat.handler.ts',
  'websocket/handlers/presence.handler.ts',
];

let totalChanges = 0;

files.forEach(file => {
  const filePath = path.join(API_DIR, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skip ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove interests field references
  content = content.replace(/^\s*interests:\s*.*,?\n/gm, '');
  content = content.replace(/interests:\s*input\.interests,?\s*/g, '');

  // Remove profilePicture references, replace with profileImages
  content = content.replace(/profilePicture:\s*true,?\s*\n/g, 'profileImages: true,\n');
  content = content.replace(/profilePicture:\s*string/g, 'profileImage: string');

  // Fix isBlocked in select (should be boolean true, not false)
  content = content.replace(/isBlocked:\s*false,?\s*\n/g, 'isBlocked: true,\n');

  const changes = original !== content;
  if (changes) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned ${file}`);
    totalChanges++;
  } else {
    console.log(`✓  ${file} (no changes)`);
  }
});

console.log(`\n✨ Done! Cleaned ${totalChanges} files.`);
