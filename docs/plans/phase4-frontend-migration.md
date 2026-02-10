# Phase 4 Completion Plan - Frontend Migration
## Bellor MVP - פברואר 2026

---

## Executive Summary

**Current Status:** 40% complete (not 75% as stated in PRD)
**Remaining Work:**
- 36 pages still use `base44.entities` directly (123 occurrences)
- 6 API services missing (Stories, Likes, Reports, Notifications, Follows, Achievements)
- Backend endpoints exist but frontend services don't use them

**Estimated Time:** 3-4 weeks for full completion

---

## Gap Analysis

### Frontend Services Status

| Service | Exists | Backend Ready | Notes |
|---------|--------|---------------|-------|
| authService.js | ✅ | ✅ | Complete |
| userService.js | ✅ | ✅ | Complete |
| chatService.js | ✅ | ✅ | Complete |
| missionService.js | ✅ | ✅ | Complete |
| responseService.js | ✅ | ✅ | Complete |
| uploadService.js | ✅ | ✅ | Complete |
| **storyService.js** | ❌ | ✅ | Backend exists |
| **reportService.js** | ❌ | ✅ | Backend exists |
| **likeService.js** | ❌ | ❌ | Need backend too |
| **followService.js** | ❌ | ❌ | Need backend too |
| **notificationService.js** | ❌ | ❌ | Need backend too |
| **achievementService.js** | ❌ | ❌ | Need backend too |

### Pages Migration Priority

**CRITICAL (8 pages - 50+ occurrences):**
1. UserProfile.jsx (13 uses)
2. SharedSpace.jsx (10 uses)
3. Matches.jsx (8 uses)
4. WriteTask.jsx (7 uses)
5. AdminReportManagement.jsx (7 uses)
6. PrivateChat.jsx (6 uses)
7. Discover.jsx (5 uses)
8. AdminUserManagement.jsx (5 uses)

**HIGH (10 pages):**
- AdminDashboard.jsx, Analytics.jsx, CompatibilityQuiz.jsx
- FollowingList.jsx, Stories.jsx, VideoTask.jsx, AudioTask.jsx
- BlockedUsers.jsx, AdminPreRegistration.jsx, VideoDate.jsx

**MEDIUM (18 pages):**
- Remaining admin, settings, and feature pages

---

## Implementation Plan

### Week 1: Backend API Completion

#### Task 1.1: Create Likes API
**Files to create/modify:**
- `apps/api/src/services/likes.service.ts`
- `apps/api/src/controllers/likes.controller.ts`
- `apps/api/src/routes/v1/likes.routes.ts`
- `apps/api/src/routes/v1/index.ts` (register routes)

**Endpoints:**
```
POST   /api/v1/likes              - Like a user/response
DELETE /api/v1/likes/:id          - Unlike
GET    /api/v1/likes/received     - Get likes I received
GET    /api/v1/likes/sent         - Get likes I sent
GET    /api/v1/users/:id/likes    - Get user's likes
```

#### Task 1.2: Create Follows API
**Files to create/modify:**
- `apps/api/src/services/follows.service.ts`
- `apps/api/src/controllers/follows.controller.ts`
- `apps/api/src/routes/v1/follows.routes.ts`

**Endpoints:**
```
POST   /api/v1/follows            - Follow user
DELETE /api/v1/follows/:userId    - Unfollow user
GET    /api/v1/follows/followers  - My followers
GET    /api/v1/follows/following  - Who I follow
```

#### Task 1.3: Create Notifications API
**Files to create/modify:**
- `apps/api/src/services/notifications.service.ts`
- `apps/api/src/controllers/notifications.controller.ts`
- `apps/api/src/routes/v1/notifications.routes.ts`

**Endpoints:**
```
GET    /api/v1/notifications           - Get my notifications
PATCH  /api/v1/notifications/:id/read  - Mark as read
DELETE /api/v1/notifications/:id       - Delete notification
POST   /api/v1/notifications/read-all  - Mark all as read
```

#### Task 1.4: Create Achievements API
**Files to create/modify:**
- `apps/api/src/services/achievements.service.ts`
- `apps/api/src/controllers/achievements.controller.ts`
- `apps/api/src/routes/v1/achievements.routes.ts`

**Endpoints:**
```
GET    /api/v1/achievements            - List all achievements
GET    /api/v1/achievements/my         - My unlocked achievements
POST   /api/v1/achievements/:id/unlock - Unlock achievement
```

---

### Week 2: Frontend Services Creation

#### Task 2.1: Create storyService.js
**File:** `apps/web/src/api/services/storyService.js`
```javascript
// Methods needed:
- getStoriesFeed()
- getMyStories()
- getUserStories(userId)
- createStory(data)
- viewStory(storyId)
- deleteStory(storyId)
- getStoryStats()
```

#### Task 2.2: Create likeService.js
**File:** `apps/web/src/api/services/likeService.js`
```javascript
// Methods needed:
- likeUser(userId, likeType)
- unlikeUser(userId)
- likeResponse(responseId)
- unlikeResponse(responseId)
- getReceivedLikes()
- getSentLikes()
```

#### Task 2.3: Create followService.js
**File:** `apps/web/src/api/services/followService.js`
```javascript
// Methods needed:
- followUser(userId)
- unfollowUser(userId)
- getFollowers()
- getFollowing()
- isFollowing(userId)
```

#### Task 2.4: Create notificationService.js
**File:** `apps/web/src/api/services/notificationService.js`
```javascript
// Methods needed:
- getNotifications(params)
- markAsRead(notificationId)
- markAllAsRead()
- deleteNotification(notificationId)
- getUnreadCount()
```

#### Task 2.5: Create reportService.js
**File:** `apps/web/src/api/services/reportService.js`
```javascript
// Methods needed:
- createReport(data)
- getReports(params)
- getReportById(id)
- reviewReport(id, action)
- getPendingCount()
```

#### Task 2.6: Create achievementService.js
**File:** `apps/web/src/api/services/achievementService.js`
```javascript
// Methods needed:
- getAllAchievements()
- getMyAchievements()
- getAchievementById(id)
- getUserAchievements(userId)
```

#### Task 2.7: Update base44Client.js
- Connect new services to compatibility layer
- Replace stubs with real implementations

#### Task 2.8: Update api/index.js
- Export all new services

---

### Week 3: Critical Pages Migration

#### Migration Pattern for Each Page:
1. Replace `base44.entities.X.filter()` → `xService.list()`
2. Replace `base44.entities.X.create()` → `xService.create()`
3. Replace `base44.entities.X.update()` → `xService.update()`
4. Replace `base44.entities.X.delete()` → `xService.delete()`
5. Update imports
6. Test functionality

#### Task 3.1: Migrate UserProfile.jsx (13 occurrences)
- Replace User, Response, Like, Follow entity calls
- Use userService, responseService, likeService, followService

#### Task 3.2: Migrate SharedSpace.jsx (10 occurrences)
- Replace Response, Chat, Message, User calls
- Already has demo data fallback ✅

#### Task 3.3: Migrate Matches.jsx (8 occurrences)
- Replace User, Like, Chat, Match calls
- Already has demo data fallback ✅

#### Task 3.4: Migrate WriteTask.jsx (7 occurrences)
- Replace Response, Mission calls

#### Task 3.5: Migrate AdminReportManagement.jsx (7 occurrences)
- Replace Report, User calls

#### Task 3.6: Migrate PrivateChat.jsx (6 occurrences)
- Replace Chat, Message calls

#### Task 3.7: Migrate Discover.jsx (5 occurrences)
- Replace User, Response, Like calls
- Already has demo data fallback ✅

#### Task 3.8: Migrate AdminUserManagement.jsx (5 occurrences)
- Replace User, Chat calls

---

### Week 4: Remaining Pages & Cleanup

#### Task 4.1: Migrate HIGH priority pages (10 pages)
- AdminDashboard.jsx
- Analytics.jsx
- CompatibilityQuiz.jsx
- FollowingList.jsx
- Stories.jsx
- VideoTask.jsx
- AudioTask.jsx
- BlockedUsers.jsx
- AdminPreRegistration.jsx
- VideoDate.jsx

#### Task 4.2: Migrate MEDIUM priority pages (18 pages)
- All remaining pages with base44.entities usage

#### Task 4.3: Remove base44Client.js Compatibility Layer
- Ensure no pages import from base44Client
- Delete the file
- Update any remaining references

#### Task 4.4: Update PRD.md
- Mark Phase 4 as 100% complete
- Update Frontend status to 100%

---

## Files to Create (New)

```
apps/api/src/services/
├── likes.service.ts
├── follows.service.ts
├── notifications.service.ts
└── achievements.service.ts

apps/api/src/controllers/
├── likes.controller.ts
├── follows.controller.ts
├── notifications.controller.ts
└── achievements.controller.ts

apps/api/src/routes/v1/
├── likes.routes.ts
├── follows.routes.ts
├── notifications.routes.ts
└── achievements.routes.ts

apps/web/src/api/services/
├── storyService.js
├── likeService.js
├── followService.js
├── notificationService.js
├── reportService.js
└── achievementService.js
```

## Files to Modify

```
apps/api/src/routes/v1/index.ts         - Register new routes
apps/web/src/api/index.js               - Export new services
apps/web/src/api/base44Client.js        - Connect services, then delete
apps/web/src/pages/*.jsx                - 36 pages to migrate
docs/product/PRD.md                      - Update status
```

---

## Verification Plan

### After Week 1 (Backend):
```bash
# Test new endpoints
curl -X POST http://localhost:3000/api/v1/likes -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/api/v1/follows/followers -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/api/v1/notifications -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/api/v1/achievements -H "Authorization: Bearer $TOKEN"
```

### After Week 2 (Services):
```javascript
// Test in browser console
import { likeService, followService } from '@/api';
await likeService.getReceivedLikes();
await followService.getFollowers();
```

### After Week 3-4 (Pages):
1. Run the app: `npm run dev:all`
2. Test each migrated page manually
3. Check browser console for any base44 warnings
4. Verify no "base44.entities" references remain:
```bash
grep -r "base44.entities" apps/web/src/pages/
# Should return empty
```

### Final Verification:
```bash
# Search for any remaining base44 usage
grep -r "base44" apps/web/src/ --include="*.jsx" --include="*.js"
# Should only find base44Client.js (if not deleted) or nothing
```

---

## Risk Mitigation

1. **Breaking Changes:** Keep base44Client.js until all pages migrated
2. **Missing Endpoints:** Create backend APIs before frontend services
3. **Testing:** Test each page after migration before moving to next
4. **Rollback:** Git commit after each major milestone

---

## Success Criteria

- [ ] All 4 new backend APIs created and working
- [ ] All 6 new frontend services created
- [ ] All 36 pages migrated (0 base44.entities usage)
- [ ] base44Client.js removed
- [ ] No console warnings about missing entities
- [ ] PRD.md updated to show Phase 4 = 100%
