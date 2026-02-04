# Phase 3: Page Layouts Migration Plan

## Problem Summary
הרכיבים (Button, Card, Avatar, Badge, Dialog) עודכנו בשלב 2 אבל **הדפים לא משתמשים בהם**.

| רכיב | מצב נוכחי | דרוש |
|------|----------|------|
| Card | 0% - כל 52 דפים משתמשים ב-`bg-white rounded-2xl` ידני | להחליף ל-`<Card>` |
| Avatar | 0% - משתמשים ב-`<img>` עם classes | להחליף ל-`<Avatar>` עם status/badge |
| Badge | 0% - `<span>` עם עיצוב inline | להחליף ל-`<Badge>` |
| Dialog | 0% - מודלים מותאמים אישית | להחליף ל-`<Dialog>` |

---

## Files to Modify (Priority Order)

### 1. FeedPost.jsx (Highest Impact)
**Path:** `src/components/feed/FeedPost.jsx`

Changes:
- Add imports: `Card, Avatar, AvatarBadge, Badge`
- Line ~187: Replace `<div className="bg-white rounded-2xl...">` → `<Card>`
- Lines ~193-208: Replace `<img className="w-10 h-10 rounded-full">` → `<Avatar>` with `<AvatarBadge verified>`
- Heart states: Use `text-love` color token instead of `text-red-500`

### 2. SharedSpace.jsx (Main Feed Page)
**Path:** `src/pages/SharedSpace.jsx`

Changes:
- Add imports: `Card, CardContent, Avatar, AvatarStatus, Badge`
- Lines ~240-255: Active chat users - Replace `<img>` → `<Avatar>` with `<AvatarStatus status="online">`
- Lines ~264-279: Hashtag filter - Replace manual badge → `<Badge variant="info">`
- Lines ~282-320: Daily mission card - Use `<Card variant="glass">` + `<Button>`
- Lines ~386-392: Profile nav avatar → `<Avatar size="sm">`

### 3. Profile.jsx (User Profile)
**Path:** `src/pages/Profile.jsx`

Changes:
- Add imports: `Card, CardContent, CardHeader, CardTitle, Avatar, AvatarBadge, Badge, Dialog`
- Lines ~94-112: Profile image → `<Card variant="profile">` with `<CardImage>`
- Lines ~145-150: About me → `<Card><CardHeader><CardTitle>`
- Lines ~152-180: Info section → `<Card><CardContent>`
- Lines ~182-197: Interests → `<Badge variant="secondary">` for each interest
- Lines ~317-348: Delete dialog → `<Dialog>` component

### 4. Notifications.jsx
**Path:** `src/pages/Notifications.jsx`

Changes:
- Add imports: `Card, CardContent, Avatar, AvatarStatus, AvatarBadge, Badge`
- Lines ~170-232: NotificationItem → `<Card variant="interactive">` + `<Avatar>` with status

### 5. UserProfile.jsx
**Path:** `src/pages/UserProfile.jsx`

Changes:
- Add imports: `Card, CardImage, Avatar, AvatarBadge, Badge, Dialog`
- Lines ~196-219: Profile image → `<Card variant="profile">`
- Lines ~336-350: Interests → `<Badge variant="secondary">`
- Lines ~409-468: Action buttons → `<Button variant="love">` and `<Button variant="premium">`
- Lines ~471-503: Message dialog → `<Dialog>` component

---

## Component Reference

### Card Variants
```jsx
<Card variant="default">     // Standard card
<Card variant="profile">     // For profile images (3:4 aspect)
<Card variant="glass">       // Glassmorphism effect
<Card variant="interactive"> // Hover lift effect
```

### Avatar with Status/Badge
```jsx
<Avatar size="md">
  <AvatarImage src={user.image} alt={user.name} />
  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
</Avatar>
<AvatarStatus status="online" size="md" />
<AvatarBadge verified size="md" />
```

### Badge Variants
```jsx
<Badge variant="verified">   // Blue verified badge
<Badge variant="premium">    // Gold gradient
<Badge variant="success">    // Green
<Badge variant="secondary">  // Gray (for interests)
```

### Button Variants
```jsx
<Button variant="love">      // Rose heart button
<Button variant="premium">   // Gold gradient
<Button variant="match">     // Pink-purple gradient
```

---

## Verification Steps

1. Run `npm run build` - verify no errors
2. Run `npm run dev` - start dev server
3. Check pages visually:
   - `/SharedSpace` - Feed items, avatars, mission card
   - `/Profile` - Cards, badges, delete dialog
   - `/Notifications` - Notification cards with avatars
4. Test responsive behavior on mobile width
5. Verify verified badges and online status indicators display

---

## Expected Visual Changes

After migration:
- Cards will have consistent rounded corners and shadows
- Avatars will show online/offline status indicators
- Verified users will have blue checkmark badges
- Buttons will use rose/burgundy primary color
- Dialogs will have blur overlay and rounded corners
