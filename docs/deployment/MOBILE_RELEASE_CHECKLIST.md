# Bellor Mobile Release Checklist

**Created:** February 8, 2026
**Last Updated:** February 8, 2026
**Status:** Pre-Release Preparation
**Related Docs:** [GOOGLE_PLAY_DEPLOYMENT.md](GOOGLE_PLAY_DEPLOYMENT.md) | [MOBILE_APP_REQUIREMENTS.md](MOBILE_APP_REQUIREMENTS.md)

---

## Pre-Requisites

- [x] Capacitor installed and configured (`apps/web/capacitor.config.ts`)
- [x] Android platform added (`apps/web/android/`)
- [x] iOS platform added (`apps/web/ios/`)
- [x] Push notifications configured (FCM)
- [x] Splash screen configured (#EC4899 brand color)
- [ ] Web build passes without errors (`npm run build`)
- [ ] All tests pass (`npm run test`)

---

## Android Release

### 1. Keystore Generation
- [ ] Generate release keystore:
  ```bash
  keytool -genkey -v -keystore bellor-release.keystore -alias bellor -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Store keystore securely (NOT in git)
- [ ] Record keystore password in a secure password manager
- [ ] Record key alias and key password in a secure password manager
- [ ] Back up keystore to a second secure location (losing it means you cannot update the app)

### 2. Gradle Signing Configuration
- [ ] Configure `apps/web/android/app/build.gradle` signing config:
  ```groovy
  android {
      signingConfigs {
          release {
              storeFile file("path/to/bellor-release.keystore")
              storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
              keyAlias "bellor"
              keyPassword System.getenv("KEY_PASSWORD") ?: ""
          }
      }
      buildTypes {
          release {
              signingConfig signingConfigs.release
              minifyEnabled true
              proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
          }
      }
  }
  ```
- [ ] Set environment variables for CI/CD:
  - `KEYSTORE_PASSWORD`
  - `KEY_PASSWORD`
  - `KEYSTORE_PATH`

### 3. App Configuration
- [ ] Update `capacitor.config.ts` with keystore path and alias (see commented placeholders)
- [ ] Verify `appId` is `com.bellor.app`
- [ ] Verify `appName` is `Bellor`
- [ ] Set correct `versionCode` and `versionName` in `build.gradle`
- [ ] Ensure `minSdkVersion` is 24 (Android 7.0)
- [ ] Ensure `targetSdkVersion` is 34 (Android 14)

### 4. Build Release AAB
- [ ] Build web assets: `npm run build` (from `apps/web/`)
- [ ] Sync with native: `npx cap sync android`
- [ ] Build release AAB:
  ```bash
  cd apps/web/android && ./gradlew bundleRelease
  ```
- [ ] Verify AAB file created at `apps/web/android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Test AAB on device/emulator:
  ```bash
  # Install bundletool (https://github.com/google/bundletool)
  java -jar bundletool.jar build-apks --bundle=app-release.aab --output=app-release.apks --local-testing
  java -jar bundletool.jar install-apks --apks=app-release.apks
  ```

### 5. Device Testing (Android)
- [ ] Install on physical device
- [ ] Test login/registration flow
- [ ] Test chat (real-time WebSocket)
- [ ] Test push notifications (foreground + background)
- [ ] Test image upload
- [ ] Test deep links (`bellor://chat/{id}`, `bellor://profile/{id}`)
- [ ] Test navigation between all screens
- [ ] Test offline behavior
- [ ] Test splash screen displays correctly
- [ ] Test app icon displays correctly
- [ ] Test on budget device (e.g., Xiaomi Redmi)
- [ ] Test on flagship device (e.g., Samsung Galaxy S21+)
- [ ] Test on stock Android (e.g., Google Pixel)

### 6. Google Play Console
- [ ] Create Google Play Console account ($25 one-time fee) at https://play.google.com/console
- [ ] Complete developer identity verification
- [ ] Create new application
- [ ] Set up app signing (Google Play App Signing recommended)
- [ ] Upload AAB to Internal Testing track first
- [ ] Test with Internal Testing track
- [ ] Promote to Closed Testing (beta testers)
- [ ] Promote to Production after successful beta

### 7. Google Play Store Listing
- [ ] App name: `Bellor` (max 30 chars)
- [ ] Short description (max 80 chars)
- [ ] Full description (max 4000 chars)
- [ ] App category: Social / Dating
- [ ] Phone screenshots: 4-8 images (1080x1920 px)
- [ ] Tablet screenshots: 2-4 images (1920x1200 px) (optional for phone-only apps)
- [ ] App icon: 512x512 PNG
- [ ] Feature graphic: 1024x500 PNG
- [ ] Content rating questionnaire completed (mark as dating app with UGC)
- [ ] Data Safety section completed:
  - Email collected (account authentication)
  - Name collected (public profile)
  - Photos collected (public profile)
  - Location collected optionally (finding matches)
  - Chat messages collected (communication)
- [ ] Target audience: 18+
- [ ] Submit for review

---

## iOS Release

### 1. Apple Developer Account
- [ ] Apple Developer account ($99/year) at https://developer.apple.com
- [ ] Enroll in Apple Developer Program
- [ ] Accept all agreements in App Store Connect

### 2. Xcode Configuration
- [ ] Open project in Xcode: `npx cap open ios` (macOS only)
- [ ] Set Bundle Identifier to `com.bellor.app`
- [ ] Set Development Team (your Apple Developer team)
- [ ] Configure automatic signing
- [ ] Set iOS Deployment Target to 14.0
- [ ] Add required device capabilities (if any)
- [ ] Configure push notification entitlement
- [ ] Add APNs key in Apple Developer portal
- [ ] Upload APNs key to Firebase for FCM-to-APNs bridging

### 3. Build & Archive
- [ ] Build web assets: `npm run build` (from `apps/web/`)
- [ ] Sync with native: `npx cap sync ios`
- [ ] Open in Xcode: `npx cap open ios`
- [ ] Select "Any iOS Device" as build target
- [ ] Product > Archive
- [ ] Validate archive
- [ ] Distribute to App Store Connect (Upload)

### 4. Device Testing (iOS)
- [ ] Install via TestFlight on physical device
- [ ] Test login/registration flow
- [ ] Test chat (real-time WebSocket)
- [ ] Test push notifications (foreground + background)
- [ ] Test image upload
- [ ] Test deep links
- [ ] Test navigation between all screens
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14 Pro (latest)
- [ ] Test on iPad (if supporting tablets)

### 5. App Store Connect
- [ ] Create app in App Store Connect
- [ ] Set app name: `Bellor`
- [ ] Set subtitle (max 30 chars)
- [ ] Write description (max 4000 chars)
- [ ] Add keywords for search
- [ ] Upload iPhone screenshots (6.5" and 5.5")
- [ ] Upload iPad screenshots (12.9") if applicable
- [ ] Set app icon: 1024x1024 PNG (no transparency, no alpha)
- [ ] Complete App Privacy (Privacy Nutrition Labels):
  - Data linked to you: Name, Email, Photos, Location
  - Data used to track you: None
- [ ] Set age rating: 17+ (dating app)
- [ ] Add review notes for Apple review team
- [ ] Submit for review

---

## Common Requirements (Both Platforms)

### Legal & Compliance
- [ ] Privacy Policy URL published and accessible
- [ ] Terms of Service URL published and accessible
- [ ] GDPR compliance (if serving EU users)
- [ ] CCPA compliance (if serving California users)
- [ ] Age verification mechanism (18+ app)
- [ ] Content moderation system active (reports & moderation)
- [ ] Data deletion capability (user can delete account)

### App Assets
- [ ] App icon in all required sizes:
  - Android: 192x192 (legacy), 432x432 (adaptive), 512x512 (store)
  - iOS: 1024x1024 (store), plus all required sizes via Xcode Asset Catalog
  - Notification icon: 96x96 monochrome (Android)
- [ ] Splash screen configured:
  - Background: #EC4899 (Bellor brand pink)
  - Logo: White, centered
  - Duration: 2 seconds
- [ ] Feature graphic (Google Play): 1024x500

### Deep Links
- [ ] Android: Digital Asset Links configured (`public/.well-known/assetlinks.json`)
- [ ] iOS: Apple App Site Association configured (`public/.well-known/apple-app-site-association`)
- [ ] Deep link patterns tested:
  - `bellor://chat/{chatId}`
  - `bellor://profile/{userId}`
  - `bellor://mission/{missionId}`
  - `bellor://discover`

### Push Notifications (Production)
- [ ] Firebase project configured for production
- [ ] FCM server key stored securely (backend environment variable)
- [ ] Android: `google-services.json` in `apps/web/android/app/`
- [ ] iOS: APNs authentication key uploaded to Firebase
- [ ] Test notifications arrive on both platforms
- [ ] Notification types work: message, match, mission, achievement

### Analytics & Monitoring
- [ ] Analytics SDK integrated (e.g., Firebase Analytics, Mixpanel)
- [ ] Crash reporting configured (e.g., Firebase Crashlytics, Sentry)
- [ ] Performance monitoring enabled
- [ ] Key events tracked:
  - App open
  - Registration
  - Login
  - Profile view
  - Match
  - Message sent
  - Premium upgrade

### Performance Checks
- [ ] Cold start time < 3 seconds
- [ ] Warm start time < 1.5 seconds
- [ ] APK/IPA size < 50MB
- [ ] Memory usage < 200MB (normal usage)
- [ ] No battery drain issues
- [ ] Images lazy loaded
- [ ] Code splitting enabled

### Security
- [ ] HTTPS only (no cleartext)
- [ ] Certificate pinning considered
- [ ] API keys not hardcoded in client code
- [ ] ProGuard/R8 enabled for Android (code obfuscation)
- [ ] Keychain used for sensitive data (iOS)
- [ ] EncryptedSharedPreferences used for sensitive data (Android)

---

## Post-Release

### After Google Play Approval
- [ ] Verify app appears in Play Store
- [ ] Download and install from store
- [ ] Run smoke tests on store version
- [ ] Monitor crash reports (Crashlytics)
- [ ] Monitor user reviews
- [ ] Set up staged rollout (10% > 50% > 100%)

### After App Store Approval
- [ ] Verify app appears in App Store
- [ ] Download and install from store
- [ ] Run smoke tests on store version
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Enable phased release if desired

### Ongoing Maintenance
- [ ] Monitor crash-free rate (target: > 99.5%)
- [ ] Monitor ANR rate (Android, target: < 0.5%)
- [ ] Monitor store ratings
- [ ] Plan regular updates (at least monthly)
- [ ] Keep dependencies up to date
- [ ] Respond to store reviews

---

## Quick Reference Commands

```bash
# Build web assets
cd apps/web && npm run build

# Sync to native platforms
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode (macOS only)
npx cap open ios

# Build Android release AAB
cd apps/web/android && ./gradlew bundleRelease

# Build Android debug APK (for testing)
cd apps/web/android && ./gradlew assembleDebug

# Check keystore info
keytool -list -v -keystore bellor-release.keystore -alias bellor

# Get SHA256 fingerprint (for Digital Asset Links)
keytool -list -v -keystore bellor-release.keystore -alias bellor | grep SHA256
```

---

**Document maintained by:** Bellor Development Team
**Next review date:** Before first store submission
