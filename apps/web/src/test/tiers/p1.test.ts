/**
 * P1 Core Frontend Tests - Chat, Content, Social
 * Run with: npx vitest run apps/web/src/test/tiers/p1.test.ts
 */

// Content pages
import '../../pages/Home.test.jsx';
import '../../pages/Creation.test.jsx';
import '../../pages/WriteTask.test.jsx';
import '../../pages/AudioTask.test.jsx';
import '../../pages/VideoTask.test.jsx';
import '../../pages/CreateStory.test.jsx';
import '../../pages/Stories.test.jsx';
import '../../pages/SharedSpace.test.jsx';

// Chat pages
import '../../pages/PrivateChat.test.jsx';
import '../../pages/LiveChat.test.jsx';
import '../../pages/TemporaryChats.test.jsx';

// Social pages
import '../../pages/Matches.test.jsx';
import '../../pages/Discover.test.jsx';
import '../../pages/Notifications.test.jsx';
import '../../pages/FollowingList.test.jsx';

// Content components
import '../../components/feed/FeedPost.test.jsx';
import '../../components/feed/StarSendersModal.test.jsx';

// Services
import '../../api/services/chatService.test.js';
import '../../api/services/likeService.test.js';
import '../../api/services/socketService.test.js';
import '../../utils/responseTransformer.test.js';
