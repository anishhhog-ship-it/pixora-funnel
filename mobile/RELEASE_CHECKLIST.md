# Pixora Funnel mobile release checklist

The native client lives in `mobile/` and uses Expo SDK 57 with Expo Router. It
uses the existing Supabase Auth session and the existing Pixora public funnel;
it does not duplicate the public customer funnel or Sales Panel.

## Release configuration

The app version is `1.0.0`. Android build number `1` and iOS build number `1`
are the initial local values used to initialize EAS remote versioning. Production
builds use EAS-managed auto-incrementing build numbers; the user-facing version
must still be updated manually in `app.json` for a new store version.

The Android package and iOS bundle identifier are intentionally unchanged:

```text
Android: com.pixora.funnel
iOS:     com.pixora.funnel
```

Do not add an `extra.eas.projectId` by hand. The owner must link or create the
Expo project while authenticated with the organization's Expo account.

## Required public environment variables

Set these in the EAS environment used for each build. The `development`,
`preview`, and `production` EAS profiles select the matching EAS environment.
Never put a service-role key, Google OAuth client secret, or refresh token in the
mobile environment. Anything prefixed with `EXPO_PUBLIC_` is bundled into the
client and must be treated as public.

```text
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
EXPO_PUBLIC_API_URL=https://funnel.pixoraautomations.com
EXPO_PUBLIC_PUBLIC_APP_URL=https://funnel.pixoraautomations.com
```

The app intentionally refuses to treat itself as configured when the anon key
is missing. For local development, copy `.env.example` to an ignored `.env` or
`.env.local` file and supply the public values. The release check reads those
files without printing their values.

## Checks

Run from `mobile/`:

```bash
npm ci
npm run release:check
npm run typecheck
npm run lint
npm run doctor
npm run export:android
npm run export:ios
```

`expo export` validates the production JavaScript bundle for the selected
platform. It is not a signed Android APK/AAB or iOS IPA and does not replace
device testing. `release:check` must run with the production public variables;
it fails when a required value is absent, local-only, or still a placeholder.

## EAS builds

The repository includes EAS profiles for development, internal preview, a
store-ready production build, and an Android APK for direct device download.
After the owner authenticates to the organization's Expo account and links or
creates the project, verify the production environment variables and run:

```bash
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
```

The production profile produces a store-distribution Android App Bundle and iOS
IPA. The production build also increments the remote Android `versionCode` or
iOS `buildNumber`; do not reuse a store build number. If this app has already
been built or released outside the linked EAS project, the owner must first run
`npx eas-cli@latest build:version:set` for each platform and initialize remote
versions from the latest store values.

Android signing and iOS distribution credentials must be managed by EAS or the
organization. Do not commit them to this repository. A successful JS export is
not evidence that native signing or store credentials are configured.

## Android direct-download page

For a physical-device APK that can be linked from a public download page, the
owner may run:

```bash
npx eas-cli@latest build --platform android --profile android-download
```

This profile is an internal-distribution, production-environment APK profile.
After the build completes, copy the actual artifact URL from the EAS build
details into the download page or its deployment configuration. Do not invent a
URL, check an EAS URL into source before a build exists, or expose an APK that
has not passed the physical-device smoke test. This APK is for direct Android
installation; it is not the Play Store submission artifact.

The public web download page already lives at `web/src/app/download/page.tsx`
and reads these web deployment variables from `web/.env.example`:

```text
NEXT_PUBLIC_MOBILE_APP_VERSION=1.0.0
NEXT_PUBLIC_ANDROID_PACKAGE_ID=com.pixora.funnel
NEXT_PUBLIC_ANDROID_DOWNLOAD_URL=<actual EAS APK artifact URL>
NEXT_PUBLIC_IOS_BUNDLE_ID=com.pixora.funnel
NEXT_PUBLIC_IOS_STORE_URL=<actual App Store URL after publication>
```

Leave either URL empty until the corresponding artifact or store listing exists;
the page intentionally renders a disabled “Coming soon” state instead of a dead
link. Keep the displayed version aligned with `mobile/app.json` for each store
release. The Android URL is the internal APK artifact for direct installation,
while the iOS URL must be the processed TestFlight/App Store listing URL.

There is no equivalent public direct-install URL for iOS from this repository.
Use the actual TestFlight or App Store URL after the owner has uploaded and
processed the iOS build. Keep those URLs out of source until they exist.

## Store submission

The submission profile deliberately targets the Android internal track with
`draft` release status. After reviewing the build and store metadata, the owner
can submit with:

```bash
npx eas-cli@latest submit --platform android --profile production
npx eas-cli@latest submit --platform ios --profile production
```

The commands above require the organization's store credentials and owner
approval. They are not run as part of local validation.

## Store readiness items still requiring owner action

- Confirm the final Android package `com.pixora.funnel` and iOS bundle ID
  `com.pixora.funnel` are available in the organization's store accounts.
- Link/create the EAS project while authenticated with the organization's Expo
  account; no account ID is stored in this repository.
- Provide the production Supabase anon key and API URL through EAS environment
  variables, then run `npm run release:check` and an authenticated smoke test on
  physical Android and iOS devices.
- Configure Supabase Auth password-reset redirect handling for the
  `pixorafunnel://reset-password` scheme and verify recovery on both platforms.
- Publish the privacy policy and terms URLs already used by the web app.
- Complete store metadata, screenshots, support contact, data-safety/privacy
  disclosures, age rating, and account-deletion review.
- Confirm the organization's Google Business Profile OAuth client redirect URI
  and sensitive-scope approval. Review synchronization remains explicitly
  unavailable when Google API access is pending.
- Validate billing, NFC fulfillment, crash monitoring, and offline/network
  behavior with production accounts before submission.
- After release, add only the actual Android, TestFlight, or App Store URLs to
  the public download page. This repository intentionally contains no invented
  store URL or credential.

Apple signing/build validation requires macOS/Xcode or an authenticated EAS
build. Store approval is not guaranteed by a successful local bundle export.
