/**
 * P1 Core Tests - Chat, Content, Social
 * Run with: npx vitest run apps/api/src/test/tiers/p1.test.ts
 *
 * These tests cover the primary user experience features.
 */

// Chat
import '../../services/chat.service.test.js';
import '../../services/chat-rooms.service.test.js';
import '../../services/chat-messages.service.test.js';
import '../../services/chat-actions.service.test.js';
import '../../websocket/handlers/presence-tracker.test.js';

// Content
import '../../services/missions.service.test.js';
import '../../services/responses.service.test.js';
import '../../services/stories.service.test.js';

// Social
import '../../services/likes.service.test.js';
import '../../services/follows.service.test.js';
import '../../services/notifications.service.test.js';
import '../../services/push-notifications.service.test.js';
