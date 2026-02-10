> **HISTORICAL DOCUMENT** - This plan was completed in January-February 2026. Kept for reference only.
> Design alignment was incorporated into the production-ready build. No further action needed.

# Bellor Design Alignment Plan
## Figma to Code Implementation Strategy

---

## Executive Summary

**Objective:** Align the Bellor application (52 pages) with the Figma design system while maintaining 100% functionality.

**Source Files:**
- **BellorUX** (`Jp4lTeYDOqGbX9yhSKXqQb`) - Screen designs & UX flows
- **Bellor-Mui** (`Xw7AxN31GF7dXOiaXxGbN6`) - Design System & Components

**Current Stack:** React + Tailwind CSS + Radix UI (shadcn/ui)
**Target:** Hybrid approach - Keep Tailwind/Radix but adopt Figma design tokens & visual language

---

## Phase 1: Design System Foundation
**Goal:** Extract and implement design tokens from Figma without changing any page code

### Tasks:
1. **Extract Design Tokens from Figma**
   - Colors (primary, secondary, accent, backgrounds, text)
   - Typography (font families, sizes, weights, line heights)
   - Spacing scale (padding, margins, gaps)
   - Border radius values
   - Shadow definitions
   - Animation/transition timings

2. **Create Design Token Files**
   - `src/styles/tokens/colors.css` - CSS variables for colors
   - `src/styles/tokens/typography.css` - Font definitions
   - `src/styles/tokens/spacing.css` - Spacing scale
   - `src/styles/tokens/effects.css` - Shadows, borders

3. **Update Tailwind Configuration**
   - Map Figma tokens to Tailwind theme
   - Extend color palette
   - Add custom font definitions
   - Configure spacing scale

4. **Create Theme Provider Enhancement**
   - Support both DARK and LIGHT modes from Figma
   - Implement smooth theme transitions

### Testing (Phase 1):
- [ ] Run `npm run build` - verify no compilation errors
- [ ] Run `npm run dev` - verify app starts
- [ ] Navigate through all 52 pages - verify no visual regressions
- [ ] Toggle dark/light mode - verify both work
- [ ] Check browser console - zero errors

### Deliverables:
- Design token files
- Updated `tailwind.config.js`
- Updated `index.css` with CSS variables
- Test report

---

## Phase 2: Core UI Components Update
**Goal:** Update base UI components to match Figma design system

### Components to Update (Priority Order):
1. **Buttons** (`button.jsx`)
   - Match Figma button variants (primary, secondary, outline, ghost, destructive)
   - Update sizes (sm, md, lg, xl)
   - Add loading states
   - Add icon button variant

2. **Cards** (`card.jsx`)
   - Update border radius
   - Adjust shadows
   - Update padding

3. **Inputs & Forms** (`input.jsx`, `textarea.jsx`, `select.jsx`)
   - Match Figma text field design
   - Update focus states
   - Add error/success states

4. **Dialogs & Modals** (`dialog.jsx`, `alert-dialog.jsx`)
   - Update overlay style
   - Match content padding
   - Update animation

5. **Navigation Components** (`tabs.jsx`, `navigation-menu.jsx`)
   - Match Figma tab design
   - Update active states

6. **Badges & Labels** (`badge.jsx`)
   - Match Figma chip/badge design
   - Add new variants

7. **Avatar** (`avatar.jsx`)
   - Match Figma avatar sizes
   - Update border styles

### Testing (Phase 2):
- [ ] Visual comparison: Each component vs Figma design
- [ ] Functionality test: All component interactions work
- [ ] Accessibility test: Focus states, keyboard navigation
- [ ] Responsive test: Components work on mobile/desktop
- [ ] Run app: Navigate to pages using updated components

### Deliverables:
- Updated 7+ UI component files
- Component storybook/preview (optional)
- Visual comparison screenshots
- Test report

---

## Phase 3: Core Pages Redesign
**Goal:** Update the 5 main user-facing pages to match Figma

### Pages to Update:
1. **Welcome/Splash** (`Welcome.jsx`, `Splash.jsx`)
   - Match Figma hero design
   - Update branding elements
   - Match button placement

2. **Onboarding** (`Onboarding.jsx`)
   - Match Figma step design
   - Update progress indicator
   - Match form layouts

3. **SharedSpace (Feed)** (`SharedSpace.jsx`)
   - Match Figma feed card design
   - Update header/navigation
   - Match mission card design

4. **Discover** (`Discover.jsx`)
   - Match Figma profile card design
   - Update swipe indicators
   - Match action buttons

5. **Profile** (`Profile.jsx`, `UserProfile.jsx`)
   - Match Figma profile layout
   - Update tabs design
   - Match content sections

### Testing (Phase 3):
- [ ] Full user flow: Welcome → Onboarding → SharedSpace
- [ ] Discover flow: Browse profiles, like, match
- [ ] Profile flow: View profile, edit, navigate tabs
- [ ] Mobile responsive: All 5 pages on mobile viewport
- [ ] Performance: Page load time < 2s
- [ ] No console errors

### Deliverables:
- Updated 5 core page files
- Before/after screenshots
- User flow video recording
- Test report

---

## Phase 4: Secondary Pages & Features
**Goal:** Update remaining user-facing pages

### Page Groups:

**Chat & Communication:**
- `PrivateChat.jsx` - Match Figma chat bubble design
- `TemporaryChats.jsx` - Match Figma chat list
- `LiveChat.jsx` - Update support chat UI

**Settings & Profile:**
- `Settings.jsx` - Match Figma settings layout
- `EditProfile.jsx` - Update form design
- `NotificationSettings.jsx` - Update toggle design
- `PrivacySettings.jsx` - Match Figma layout
- `FilterSettings.jsx` - Update filter UI
- `ThemeSettings.jsx` - Update theme picker

**Content Creation:**
- `AudioTask.jsx` - Update audio recording UI
- `VideoTask.jsx` - Update video recording UI
- `WriteTask.jsx` - Update text editor UI
- `CreateStory.jsx` - Match Figma story creator

**Social Features:**
- `Matches.jsx` - Update match card design
- `Stories.jsx` - Match Figma stories UI
- `FollowingList.jsx` - Update list design
- `Achievements.jsx` - Match Figma badge design
- `Analytics.jsx` - Update chart design

**Support & Info:**
- `HelpSupport.jsx` - Update help layout
- `FAQ.jsx` - Match Figma accordion design
- `Feedback.jsx` - Update form design
- `SafetyCenter.jsx` - Match info layout

**Premium & Features:**
- `Premium.jsx` - Update pricing cards
- `ReferralProgram.jsx` - Match referral UI
- `DateIdeas.jsx` - Update idea cards
- `IceBreakers.jsx` - Match card design
- `CompatibilityQuiz.jsx` - Update quiz UI

**Legal Pages:**
- `PrivacyPolicy.jsx` - Update typography
- `TermsOfService.jsx` - Update typography

### Testing (Phase 4):
- [ ] Navigate to all updated pages
- [ ] Test all interactive elements (forms, buttons, toggles)
- [ ] Verify chat functionality
- [ ] Verify content creation flows
- [ ] Mobile responsive check
- [ ] No console errors

### Deliverables:
- Updated 25+ page files
- Comprehensive test checklist
- Test report

---

## Phase 5: Admin Panel & Polish
**Goal:** Update admin pages and final polish

### Admin Pages:
- `AdminDashboard.jsx` - Match Figma dashboard design
- `AdminUserManagement.jsx` - Update table design
- `AdminChatMonitoring.jsx` - Update monitoring UI
- `AdminReportManagement.jsx` - Match report cards
- `AdminActivityMonitoring.jsx` - Update activity feed
- `AdminSystemSettings.jsx` - Update settings layout
- `AdminPreRegistration.jsx` - Update pre-reg list

### Final Polish:
1. **Micro-interactions**
   - Add hover animations
   - Add loading skeletons
   - Add page transitions

2. **Empty States**
   - Design empty state illustrations
   - Add helpful messages

3. **Error States**
   - Update error pages
   - Add retry functionality

4. **Performance Optimization**
   - Lazy load images
   - Optimize component re-renders
   - Bundle size analysis

### Testing (Phase 5):
- [ ] Full admin panel walkthrough
- [ ] All CRUD operations work
- [ ] Data displays correctly
- [ ] Charts render properly
- [ ] Final visual QA on all 52 pages
- [ ] Lighthouse score > 80
- [ ] No console errors/warnings

### Deliverables:
- Updated admin pages
- Performance report
- Final QA checklist (all 52 pages)
- Release notes

---

## Page Inventory (52 Total)

| # | Page | Phase | Priority |
|---|------|-------|----------|
| 1 | Welcome.jsx | 3 | High |
| 2 | Splash.jsx | 3 | High |
| 3 | Onboarding.jsx | 3 | High |
| 4 | Home.jsx | 3 | High |
| 5 | SharedSpace.jsx | 3 | High |
| 6 | Discover.jsx | 3 | High |
| 7 | Profile.jsx | 3 | High |
| 8 | UserProfile.jsx | 3 | High |
| 9 | PrivateChat.jsx | 4 | Medium |
| 10 | TemporaryChats.jsx | 4 | Medium |
| 11 | Matches.jsx | 4 | Medium |
| 12 | Settings.jsx | 4 | Medium |
| 13 | EditProfile.jsx | 4 | Medium |
| 14 | NotificationSettings.jsx | 4 | Low |
| 15 | PrivacySettings.jsx | 4 | Low |
| 16 | FilterSettings.jsx | 4 | Low |
| 17 | ThemeSettings.jsx | 4 | Low |
| 18 | Stories.jsx | 4 | Medium |
| 19 | CreateStory.jsx | 4 | Medium |
| 20 | AudioTask.jsx | 4 | Medium |
| 21 | VideoTask.jsx | 4 | Medium |
| 22 | WriteTask.jsx | 4 | Medium |
| 23 | Creation.jsx | 4 | Medium |
| 24 | Achievements.jsx | 4 | Low |
| 25 | Analytics.jsx | 4 | Low |
| 26 | FollowingList.jsx | 4 | Low |
| 27 | BlockedUsers.jsx | 4 | Low |
| 28 | Notifications.jsx | 4 | Medium |
| 29 | LiveChat.jsx | 4 | Low |
| 30 | HelpSupport.jsx | 4 | Low |
| 31 | FAQ.jsx | 4 | Low |
| 32 | EmailSupport.jsx | 4 | Low |
| 33 | Feedback.jsx | 4 | Low |
| 34 | SafetyCenter.jsx | 4 | Low |
| 35 | Premium.jsx | 4 | Medium |
| 36 | ProfileBoost.jsx | 4 | Low |
| 37 | ReferralProgram.jsx | 4 | Low |
| 38 | DateIdeas.jsx | 4 | Low |
| 39 | IceBreakers.jsx | 4 | Low |
| 40 | CompatibilityQuiz.jsx | 4 | Low |
| 41 | VirtualEvents.jsx | 4 | Low |
| 42 | VideoDate.jsx | 4 | Low |
| 43 | UserVerification.jsx | 4 | Medium |
| 44 | PrivacyPolicy.jsx | 4 | Low |
| 45 | TermsOfService.jsx | 4 | Low |
| 46 | AdminDashboard.jsx | 5 | Medium |
| 47 | AdminUserManagement.jsx | 5 | Medium |
| 48 | AdminChatMonitoring.jsx | 5 | Medium |
| 49 | AdminReportManagement.jsx | 5 | Medium |
| 50 | AdminActivityMonitoring.jsx | 5 | Low |
| 51 | AdminSystemSettings.jsx | 5 | Low |
| 52 | AdminPreRegistration.jsx | 5 | Low |

---

## Risk Mitigation

### Functionality Protection:
1. **Git Branching:** Each phase in separate feature branch
2. **Incremental Commits:** Small, reviewable changes
3. **No Logic Changes:** Only CSS/styling modifications
4. **Backup:** Full backup before each phase

### Testing Strategy:
1. **Before Each Phase:** Full app smoke test
2. **During Phase:** Component-level testing
3. **After Each Phase:** Full regression test
4. **User Flows:** Critical path testing

### Rollback Plan:
- Git revert to previous phase if issues found
- Each phase is independently deployable

---

## Success Criteria

- [ ] All 52 pages match Figma design
- [ ] Zero functionality regressions
- [ ] Dark/Light mode both work
- [ ] Mobile responsive (320px - 1920px)
- [ ] Performance: Lighthouse > 80
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Zero console errors/warnings

---

## Appendix: Figma Design System Components

From **Bellor-Mui** file:
- Accordion, Alert, App, Appbar, Avatar, Badge, Brand
- Breadcrumb, Buttons, Cards, Carousel, Chart, Checkbox, Chip
- Colors, Dialog, Editor, Grid, Illustrations, Label, List
- Menu, Navigation, Pagination, Picker, Progress, RadioButton
- Rating, Shadows, Slider, Snackbar, Stepper, Switch, Table
- Tabs, Text field, Timeline, Tooltip & Popover, Typography, Upload

Both **DARK** and **LIGHT** variants available for all components.

---

*Document created: January 2026*
*Completed: February 2026*
*Project: Bellor Dating App*
*Version: 1.0*
