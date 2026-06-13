# Aura Live Activity (focus sessions)

A DoorDash-style **Live Activity** for an active task. When a student taps
**Start focus session** on a task, Aura shows a glowing countdown — on the lock
screen and Dynamic Island (iOS 16.2+) and in an always-visible in-app widget —
that counts down over the task's `estimatedMinutes`, with pause/resume, +5 min,
complete, and tap-to-open.

## Architecture

The **React layer is the single source of truth.** The native Live Activity
only mirrors it.

```
useTaskSession (hooks/useTaskSession.tsx)     ← timing state machine, the truth
        │  start / pause / resume / extend / complete / cancel
        ├──────────────► ActiveTaskWidget (components/tasks/ActiveTaskWidget.tsx)
        │                 in-app floating card — works everywhere, incl. Expo Go
        └──────────────► services/liveActivity.ts
                                │  (safe no-op when native module absent)
                                └──► modules/aura-live-activity (this module)
                                          │  JS↔ActivityKit bridge (Swift)
                                          └──► targets/aura-task-activity
                                                    SwiftUI lock screen + Dynamic Island
```

The countdown bar in SwiftUI uses `ProgressView(timerInterval:)`, so it animates
on its own — **no per-second push updates**. We only push a new content state on
transitions (pause, resume, extend, end).

### Files

| File | Role |
|---|---|
| `index.ts` | Typed JS surface; `requireOptionalNativeModule` → `null` when unavailable |
| `ios/AuraLiveActivityModule.swift` | Expo module: `start/update/end/areActivitiesEnabled` |
| `ios/AuraTaskAttributes.swift` | **Canonical** ActivityKit attributes (shared contract) |
| `ios/AuraLiveActivity.podspec` | Pod spec for the local module |
| `../../targets/aura-task-activity/` | The widget extension (SwiftUI views + `@main` bundle) |

## Building it (required — does NOT run in Expo Go)

Live Activities need a native widget extension, so they only appear in a
**custom dev client / EAS build on a real iOS device** (the Simulator can show
the lock screen card but not always the Dynamic Island).

```bash
# 1. Install the config plugin that generates the widget-extension target
pnpm --filter @aura/mobile add -D @bacons/apple-targets

# 2. Generate native projects (creates the AuraTaskActivity target from
#    targets/aura-task-activity/expo-target.config.js)
pnpm --filter @aura/mobile exec expo prebuild -p ios --clean

# 3. Build & run a dev client on a device
pnpm --filter @aura/mobile exec expo run:ios --device
#    …or build with EAS:  eas build --profile development -p ios
```

`app.json` already sets `ios.infoPlist.NSSupportsLiveActivities: true` and
registers the `@bacons/apple-targets` plugin.

> **Set `ios.appleTeamId` in `app.json`.** `@bacons/apple-targets` needs your
> Apple Developer Team ID to sign the widget extension; without it `expo
> prebuild` warns and the iOS build can fail. Find it in Xcode (Signing &
> Capabilities) or the Apple Developer portal and add it under `expo.ios`.

### ⚠️ Shared attributes

`AuraTaskAttributes` must be the **same type** in the app target (this module)
and the widget extension. ActivityKit matches activities by attribute type, so a
fork breaks the connection. Today the struct is duplicated byte-for-byte in:

- `modules/aura-live-activity/ios/AuraTaskAttributes.swift` (canonical)
- `targets/aura-task-activity/AuraTaskAttributes.swift` (copy)

Keep them identical. Preferred follow-up: extract to one file added to both
targets' membership, or a shared framework, so there's a single source.

## Behavior without ActivityKit

- **Android / web / Expo Go / pre-dev-build:** the native module resolves to
  `null`; `services/liveActivity.ts` logs a `[STUB]` line and no-ops. The in-app
  `ActiveTaskWidget` still drives the whole experience.
- **Android follow-up:** map sessions to an ongoing notification (there's no
  Live Activity equivalent).

## Known follow-ups

- On app relaunch the in-app session is restored from `AsyncStorage`, but the
  native activity's id is lost, so we don't currently reconcile/end a
  pre-existing native activity. Expose `getActiveActivityIds()` from the module
  to fix this.
- Interactive Live Activity buttons (iOS 17 `AppIntents`) for pause/complete
  directly from the lock screen.
