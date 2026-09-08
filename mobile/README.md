# Gesher for iOS

Native iOS client for the Gesher headlines, live radio, and podcasts site. It reuses the same TypeScript feed parsers as the Next.js app and is set up for Expo Application Services (EAS) builds and App Store submission.

This environment cannot finish the App Store upload. Apple requires a paid Apple Developer Program membership, App Store Connect access, and your Expo login. The repo is ready for those steps.

## Run locally

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `w` for a clickable iPhone-framed web preview:

```bash
npx expo start --web --port 8081
```

Open `http://localhost:8081` (or the Cursor port preview for 8081). On a desktop-width viewport the app sits inside an iPhone 16 chrome so you can tap headlines, language, podcasts, and radio. Narrow viewports go full-bleed; append `?frame=0` to force that.

## Ship to the App Store

1. Enroll at [developer.apple.com](https://developer.apple.com/programs/) ($99/year) with the Apple ID that should own the app.
2. Deploy the Next.js site (Vercel or similar) so `/privacy` and `/support` are live public URLs. App Review requires both.
3. In `store.config.json`, replace `https://REPLACE_WITH_DEPLOYED_SITE` with that domain.
4. Create an Expo account, then from `mobile/`:

   ```bash
   npx eas-cli login
   npx eas-cli init
   npx eas-cli build --platform ios --profile production
   ```

   The first build will create the bundle ID `com.jonathanmorav.gesher`, signing certificates, and a store distribution profile. EAS can do this without a Mac.
5. In [App Store Connect](https://appstoreconnect.apple.com) create the app:
   - Name: **גשר** (or Gesher)
   - Bundle ID: `com.jonathanmorav.gesher`
   - Primary language: Hebrew or English (U.S.)
   - SKU: `gesher-ios`
   - Category: News
6. Upload the binary:

   ```bash
   npx eas-cli submit --platform ios --latest
   ```

   Or combine the last two commands: `npx eas-cli build --platform ios --profile production --auto-submit`
7. After TestFlight processing, add screenshots (iPhone 6.9" required), the privacy answers (no tracking, no account), and submit for App Review.

Review notes you can paste:

> Gesher is a bilingual Israel news reader with live radio and podcasts. It is not a website wrapper. Headlines come from public RSS feeds; tapping a story opens the publisher. Radio uses public station streams and continues in the background. There is no login and no tracking. Demo: open the app, wait for headlines, tap Play on Galgalatz, switch Hebrew/English, open Podcasts and play an episode.

## App identity

| Field | Value |
| --- | --- |
| Display name | גשר |
| Bundle ID | `com.jonathanmorav.gesher` |
| Background mode | Audio (live radio / podcasts) |
| Encryption export | Exempt (`ITSAppUsesNonExemptEncryption` = false) |

Change the bundle ID in `app.json` if that identifier is already taken on your team.
