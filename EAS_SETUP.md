# EAS / App Store Setup — Final Steps Before Submission

Two things still need a human in the loop. Both must happen before you submit
to App Store Connect — without them, push notifications and the Sign in with
Apple capability won't work in a production build.

---

## 1. Initialize the EAS project

Push notifications use an Expo push token tied to your EAS project ID.
The project ID slot in `app.json` is currently empty.

From `apps/mobile`:

```bash
cd apps/mobile
npx eas init
```

This will:
- Prompt you to log in to your Expo account if you aren't already.
- Create a new EAS project tied to your account (or attach to an existing one).
- Write the resulting `projectId` into `app.json` under `expo.extra.eas.projectId`.

Verify afterward:
```bash
grep -A1 "eas" app.json
# Should show: "projectId": "<a uuid>"
```

Then build:
```bash
npx eas build --platform ios --profile production
```

---

## 2. Install Apple Sign In capability

The `expo-apple-authentication` plugin and `usesAppleSignIn: true` flag in
`app.json` tell Expo to add the entitlement. The actual capability still needs
to be enabled in your Apple Developer account once:

1. Go to https://developer.apple.com/account/resources/identifiers
2. Find your bundle ID (`com.chronos.app`)
3. Enable the **Sign In with Apple** capability.
4. Save.

Then run a fresh build (`npx eas build`) so the new entitlement file is
embedded.

---

## 3. Privacy Policy URL — must be live before submission

`app.json` currently points to `https://chronos-app.com/privacy`. Either:

- **Host the policy at that URL.** The full policy text is in `PRIVACY_POLICY.md`
  at the repo root — copy that into your website CMS, or build a small static
  page.
- **Or change the URL** in `app.json`'s `privacyPolicyUrl` (and `supportUrl`,
  `termsUrl`) to wherever you actually host them.

App Store Connect will reject the submission if it can't reach the privacy
policy URL.

---

## 4. Install JavaScript dependencies

`expo-apple-authentication` was added to `package.json`. Install it:

```bash
pnpm install
# or, from apps/mobile: npx expo install expo-apple-authentication
```

If you're building locally with `npx expo run:ios`, this also regenerates the
iOS native project so the entitlement and Info.plist changes take effect.
