#!/usr/bin/env node
/**
 * Automatic Schema Fix Script
 * Fixes all field name mismatches between code and Prisma schema
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../apps/api/src');

// Mapping of replacements to make
const replacements = [
  // dateOfBirth → birthDate
  { from: /dateOfBirth/g, to: 'birthDate' },

  // isActive → !isBlocked (need to handle carefully)
  { from: /isActive:\s*true/g, to: 'isBlocked: false' },
  { from: /isActive:\s*false/g, to: 'isBlocked: true' },
  { from: /isActive:\s*isActive/g, to: 'isBlocked: !isActive' },
  { from: /user\.isActive/g, to: '!user.isBlocked' },
  { from: /isActive\?/g, to: '!isBlocked?' },
  { from: /,\s*isActive/g, to: ', isBlocked' },
  { from: /where:\s*{\s*isActive/g, to: 'where: { isBlocked' },

  // lastLoginAt → lastActiveAt
  { from: /lastLoginAt/g, to: 'lastActiveAt' },

  // isEmailVerified → isVerified
  { from: /isEmailVerified/g, to: 'isVerified' },

  // conversationId → chatId
  { from: /conversationId/g, to: 'chatId' },

  // conversation → chat (model name)
  { from: /prisma\.conversation/g, to: 'prisma.chat' },
  { from: /include:\s*{\s*conversation/g, to: 'include: { chat' },

  // profilePicture → profileImages[0]
  { from: /profilePicture:\s*string/g, to: 'profileImage: string' },

  // Gender enum - add NON_BINARY
  { from: /'MALE'\s*\|\s*'FEMALE'\s*\|\s*'OTHER'/g, to: "'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER'" },
];

// Files to process
const filesToFix = [
  'services/auth.service.ts',
  'services/users.service.ts',
  'controllers/users.controller.ts',
  'routes/v1/auth.routes.ts',
  'websocket/handlers/chat.handler.ts',
  'websocket/handlers/presence.handler.ts',
];

console.log('🔧 Starting schema mismatch fixes...\n');

let totalChanges = 0;

filesToFix.forEach(relativePath => {
  const filePath = path.join(API_DIR, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${relativePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changesMade = 0;

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      changesMade += matches.length;
      content = content.replace(from, to);
    }
  });

  if (changesMade > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${relativePath} (${changesMade} changes)`);
    totalChanges += changesMade;
  } else {
    console.log(`✓  ${relativePath} (no changes needed)`);
  }
});

console.log(`\n✨ Complete! Made ${totalChanges} total changes.`);
console.log('\nNext steps:');
console.log('1. Remove interests field references (not in schema)');
console.log('2. Update profilePicture usage to profileImages[0]');
console.log('3. Run: npm run build');
