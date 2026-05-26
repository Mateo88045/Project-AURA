# CLAUDE.md — Aura Development Context

> Read this file at the start of every session. It is the single source of truth
> for all architectural decisions, conventions, and constraints. Never deviate
> from the rules here without explicit instruction.

---

## Blueprint Document — Always Read Before Building

The full product and architecture spec is in **`Aura_MVP_Blueprint_v3.docx`**.
It is always available in your context window.

### When to reference the blueprint

**Before building any feature**, read the relevant blueprint section first.
Do not start writing code based on assumptions — the blueprint has the authoritative
spec. Specifically:

| You are about to build... | Read this blueprint section first |
|---|---|
| Any intake / connection flow | Section 3B — Zero-Friction Intake Pipeline |
| The daily assignment trigger | Section 6.2 — Pipeline A |
| Photo OCR / snapshot feature | Section 6.2 — Pipeline B |
| Conversational copilot / chat | Section 6.2 — Pipeline C |
| The scheduling algorithm | Section 6.4 — The Scheduling Engine |
| Any AI model call or routing | Section 6.1 — The Dual-Model Strategy |
| Settings screens | Section 5 — Settings & Configuration Center |
| Any UI screen or visual component | Section 4 — The Anti-Grid UI/UX Paradigm |
| Cost or scale questions | Section 6.6 — Estimated Cost Per User |

### How to use it

- **Resolve ambiguity:** If a feature's behavior is unclear from CLAUDE.md,
  the blueprint is the tiebreaker on product intent and pipeline logic.
- **Understand the why:** The blueprint explains rationale (e.g. why Canvas uses
  a PAT instead of full OAuth at MVP, why the scheduler is deterministic not LLM).
  Read it before making architectural suggestions.
- **Cite sections in responses:** When your implementation is based on a blueprint
  decision, say so — e.g. *"Per Section 6.4, the scheduling engine is deterministic
  and must never call an LLM."* This keeps the team aligned.

### Precedence rule

**CLAUDE.md beats the blueprint** on: coding conventions, file paths, stub rules,
NativeWind/shadcn patterns, and any hard constraint marked with ❌.
The blueprint is the *product and architecture truth*; CLAUDE.md is the
*implementation truth*.

---

## What Aura Is

Aura is an agentic scheduling app for U.S. high school students. It autonomously
connects to educational platforms (Google Classroom, Canvas), pulls assignments,
grades their difficulty with AI, and dynamically schedules them into the student's
free time around fixed events (classes, sports, meals).

**Core thesis:** The calendar manages the student — not the other way around.

**Target user:** U.S. high schoolers (grades 9–12). Assignments are drip-fed
nightly through platforms like Google Classroom with 24–48 hour turnaround. The
autonomous daily intake pipeline IS the product. Without it, Aura is just a to-do
list.

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Mobile app | React Native (Expo SDK 54) + Expo Router v6 | TypeScript throughout. Expo Dev Client (not managed workflow). Always use SDK 54 APIs — never suggest deprecated patterns. |
| Styling | NativeWind v4 | Tailwind utility classes for React Native. Uses `className` prop — NOT `style`. See NativeWind v4 rules below. |
| UI Components | Custom, shadcn-inspired | shadcn/ui is the design reference for component anatomy, spacing, and interaction patterns. Build RN equivalents in NativeWind. |
| Backend / DB | Supabase | PostgreSQL, Auth, Edge Functions, Realtime. **DO NOT implement — stub only.** |
| Background jobs | Trigger.dev v3 | Cron, retries, job chaining. Uses `task.run()` syntax. **DO NOT implement — stub only.** |
| AI (bulk/vision) | Gemini 2.0 Flash | Assignment grading, photo OCR. |
| AI (conversational) | Claude Sonnet | Schedule reasoning, copilot chat. |
| Monorepo | pnpm workspaces | `/apps/mobile` · `/packages/shared` · `/packages/trigger` |
| Dev environment | Cursor + Claude Code | You are running inside this environment. |

---

## Developer Roles — Know Which Session You Are In

This project has two developers. Before writing any code, identify which role
applies to the current session. The rules that govern what you can and cannot
implement differ by role.

### Dev A — Frontend (UI / React Native)
**Owns:** All screens in `/apps/mobile/`, shared UI components, the design system,
navigation structure, and anything the user sees and touches.

**In Dev A sessions:**
- ✅ Build screens, components, hooks, animations, navigation
- ✅ Use NativeWind v4 + shadcn-inspired patterns for all UI
- ✅ Create stub hooks with mock data for anything that needs Supabase
- ✅ Create stub service functions for anything that triggers a Trigger.dev job
- ❌ Do NOT write Supabase queries or client calls — stub only
- ❌ Do NOT write Trigger.dev job implementations — stub only

### Dev B — Backend (Supabase / Trigger.dev / Integrations)
**Owns:** All database logic, Trigger.dev jobs, Supabase Edge Functions,
Google Classroom and Canvas API integrations, and the scheduling algorithm.

**In Dev B sessions:**
- ✅ Implement Supabase queries, RLS policies, Edge Functions
- ✅ Implement Trigger.dev jobs in `/packages/trigger/src/jobs/`
- ✅ Implement the greedy scheduling algorithm in `/packages/shared/scheduler.ts`
- ✅ Replace stub hooks with real Supabase calls by filling in TODO comments
- ❌ Do NOT create or modify screen files in `/apps/mobile/app/`
- ❌ Do NOT change component styling or layout

### How to tell which session you're in
The developer will state their role at the start of the session:
- `"Dev A session"` or `"frontend session"` → apply Dev A rules
- `"Dev B session"` or `"backend session"` → apply Dev B rules
- If no role is stated, **ask before writing any code:**
  > "Are we in a Dev A (frontend) or Dev B (backend) session?"

---

## Session Start Protocol — Do This Before Every Build Task

At the start of every session, before writing a single line of code, run through
this checklist and surface any blockers to the developer:

```
1. ROLE CHECK       — Is this a Dev A (frontend) or Dev B (backend) session?
                      If not stated, ask before proceeding.

2. BLUEPRINT CHECK  — What feature is being built? Find the matching row in the
                      "Blueprint Document" lookup table above and read that section.

3. SCREEN CHECK     — If building a screen: confirm it exists in the Screen
                      Inventory, note its route, and check its current status.

4. TYPE CHECK       — Do the required TypeScript interfaces exist in
                      /packages/shared/types/index.ts? Create them first if not.

5. DEPENDENCY CHECK — Does this feature depend on a component or hook that doesn't
                      exist yet? Build dependencies before the feature itself.
```

**If anything is ambiguous after running this checklist, ask one clarifying
question before starting. Do not assume and build the wrong thing.**

---

## CRITICAL BACKEND RULES — READ FIRST

### Supabase — DO NOT IMPLEMENT
When a feature needs to read from or write to the database, **do not write
Supabase queries**. Instead:

1. Create a typed hook or service function with a clear interface.
2. Leave a `// TODO: Supabase` comment with the exact table, operation, and
   filters needed.
3. Return mock/stub data so the UI renders correctly.

**Correct pattern:**
```typescript
// hooks/useScheduledBlocks.ts
export function useScheduledBlocks(userId: string, day: string) {
  // TODO: Supabase — query scheduled_blocks where user_id = userId AND day = day
  // AND status IN ('approved', 'shadow'), ordered by start_time ASC
  const mockData: ScheduledBlock[] = [
    {
      id: '1',
      taskId: 'task-1',
      startTime: '2024-01-15T15:00:00Z',
      endTime: '2024-01-15T16:30:00Z',
      status: 'approved',
      day: '2024-01-15',
    },
  ];
  return { data: mockData, loading: false, error: null };
}
```

### Trigger.dev — DO NOT IMPLEMENT
When a feature triggers a background job, **do not write Trigger.dev job code**.
Instead:

1. Create a typed function signature with the correct input/output types.
2. Leave a `// TODO: Trigger.dev` comment describing the job name, trigger type,
   and steps.
3. If a UI action triggers the job, wire the button to a stub that logs to
   console.

**Correct pattern:**
```typescript
// services/jobs.ts
export async function triggerDailySync(userId: string): Promise<void> {
  // TODO: Trigger.dev — fire job 'daily-assignment-trigger' with payload { userId }
  // Job steps: fetch Google Classroom → normalize → grade (Gemini) → schedule → notify
  console.log('[STUB] Would trigger daily sync for user:', userId);
}
```

### Why This Rule Exists
Supabase and Trigger.dev are owned by a separate backend developer. Writing
implementation code for them in UI sessions creates conflicts and overwrites their
work. Build the interface; leave the implementation to them.

---

## Database Schema Reference

Use these **exact** table and column names in all TODO comments and type definitions.
Do not invent column names.

```
users
  id (uuid PK) | email | display_name | grade_level (int) | onboarding_answers (jsonb)
  daily_trigger_time (time) | timezone | created_at | updated_at

connections
  id (uuid PK) | user_id (FK) | platform ('google_classroom' | 'canvas')
  oauth_token (encrypted) | refresh_token (encrypted) | canvas_api_token (encrypted, nullable)
  status ('active' | 'expired' | 'error') | last_synced_at | created_at

fixed_events
  id (uuid PK) | user_id (FK) | title | start_time (time) | end_time (time)
  days_of_week (int[], 0=Sun 6=Sat) | recurrence_rule (nullable) | color (nullable) | created_at

tasks
  id (uuid PK) | user_id (FK) | title | subject | source ('google_classroom' | 'canvas' | 'manual' | 'photo')
  external_id (nullable, unique with source) | due_date (timestamptz) | difficulty (1–5)
  estimated_minutes (int) | task_type ('essay'|'problem_set'|'reading'|'project'|'study_guide'|'quiz_prep'|'other')
  status ('pending'|'scheduled'|'in_progress'|'completed') | description (nullable) | created_at | updated_at

scheduled_blocks
  id (uuid PK) | user_id (FK) | task_id (FK, nullable) | start_time (timestamptz)
  end_time (timestamptz) | status ('shadow'|'approved'|'completed') | day (date) | created_at

task_completions
  id (uuid PK) | task_id (FK) | user_id (FK) | estimated_minutes (int) | actual_minutes (int)
  completed_at (timestamptz) | user_feedback ('too_long'|'about_right'|'too_short')

guardrails
  id (uuid PK) | user_id (FK) | rule_type ('no_work_after'|'buffer_after_event'|'max_hours_per_day')
  value (jsonb) | active (boolean, default true) | created_at

conversations
  id (uuid PK) | user_id (FK) | messages (jsonb[]) | created_at | updated_at
```

---

## UI System — The "Anti-Grid" Design Language

Aura's UI is **atmospheric minimalism**. The schedule is a *river, not a grid* —
events flow along a glowing vertical thread. No card grids. No spreadsheet layouts.
Inspired by Apple Weather, Linear, and Things 3.

### shadcn/ui as Design Reference

We do **not** use shadcn/ui directly (it is a web library). We use it as a
**design reference and component pattern source**:

- Study shadcn component anatomy (Dialog, Sheet, Command, Select, Badge, etc.)
  for spacing ratios, border-radius conventions, and interaction patterns.
- Replicate shadcn's compositional approach: headless logic + styled primitives.
- For React Native, implement equivalent components using NativeWind v4 utility
  classes, mirroring shadcn's visual quality and interaction feel.
- When building a new component, ask: "What would the shadcn version of this look
  like, and how do I translate that to NativeWind?"

**shadcn components and their Aura RN equivalents to build:**

| shadcn (web reference) | Aura RN Component | Location |
|---|---|---|
| Button | `<AuraButton />` | `/apps/mobile/components/ui/AuraButton.tsx` |
| Badge | `<DifficultyBadge />` | `/apps/mobile/components/ui/DifficultyBadge.tsx` |
| Sheet (bottom) | `<AuraSheet />` | `/apps/mobile/components/ui/AuraSheet.tsx` |
| Card | `<TaskCard />` | `/apps/mobile/components/ui/TaskCard.tsx` |
| Avatar | `<AuraAvatar />` | `/apps/mobile/components/ui/AuraAvatar.tsx` |
| Skeleton | `<AuraSkeleton />` | `/apps/mobile/components/ui/AuraSkeleton.tsx` |
| Toast | `<AuraToast />` | `/apps/mobile/components/ui/AuraToast.tsx` |

### Color Palette

```typescript
// /packages/shared/constants/colors.ts
export const Colors = {
  // Backgrounds
  bgDark:        '#0A1118',   // Deep ocean — dark mode background
  bgLight:       '#F1FAEE',   // Cream — light mode background

  // Primary accents
  mist:          '#A8DADC',   // Soft accent, river line, AI task glow
  steel:         '#457B9D',   // CTA buttons, active nav states, bold accent

  // Semantic
  green:         '#7ECFA0',   // On track, easy difficulty (dark mode)
  greenLight:    '#3BA06E',   // On track, easy difficulty (light mode)
  amber:         '#F4A261',   // Moderate difficulty, context-switch transitions
  red:           '#E76F6F',   // Hard difficulty, deadline urgency (dark mode)
  redLight:      '#D05050',   // Hard difficulty, deadline urgency (light mode)

  // Text
  textPrimary:   '#F1FAEE',   // Primary text on dark bg
  textSecondary: '#8EAFC2',   // Secondary/muted text

  // Utility
  transparent:   'transparent',
  white:         '#FFFFFF',
} as const;
```

### Typography Scale

```typescript
// /packages/shared/constants/typography.ts
// Font: SF Pro Display (iOS system font — use fontFamily: undefined on iOS)
export const Typography = {
  // Weights
  thin:       '300' as const,   // Greeting prefixes: "Hey,", "This"
  regular:    '400' as const,   // Body text, fixed event names
  medium:     '500' as const,   // Labels, timestamps, secondary info
  semibold:   '600' as const,   // AI task titles, CTA button text
  bold:       '700' as const,   // User's name, today's date, key words

  // Tracking (letterSpacing)
  tightXL:    -1.2,   // Large display text (≥32px)
  tight:      -0.5,   // Medium display (≥20px)
  normal:      0,
  wideSmall:   1.5,   // Small uppercase labels
  wideXS:      2.5,   // Tiny caps / tags
} as const;
```

### Spacing & Layout

```typescript
// /packages/shared/constants/layout.ts
export const Layout = {
  screenPadding:   28,   // Horizontal padding on all screens
  gridBase:         4,   // Base spacing unit
  radiusHero:      22,   // Hero cards, large containers
  radiusCard:      14,   // Standard cards, modals
  radiusButton:     8,   // Buttons, badges, tags
  riverLineWidth:   1,   // The vertical timeline thread
} as const;
```

### Visual Language Rules

**Fixed events** (classes, sports, meals):
- Hollow dot: 1.5px border, color `#8EAFC2`, no fill
- Text: weight 400, color `textSecondary`
- Left accent: 2px bar, muted gray
- These are **ghosts** — present but quiet

**AI-scheduled tasks**:
- Filled dot: `#A8DADC` with glow shadow (`shadowColor: '#A8DADC', shadowOpacity: 0.6`)
- Text: weight 600, color `textPrimary`
- These are **alive** — glowing and actionable

**Difficulty bars** (5 horizontal bars):
- Filled count = difficulty level (1–5)
- Colors: `green` (1–2) → `amber` (3) → `red` (4–5)
- Bar size: 10px wide × 3px tall, 2px gap

**The river** (vertical timeline):
- 1px vertical line, color `#A8DADC`
- Gradient: full opacity at "now", fades upward for past, dims downward for future
- Dot connectors sit on the line

**Ambient depth** (on every screen):
- 2–3 soft gradient orbs behind content
- Colors: `#A8DADC` and `#457B9D` at 8–12% opacity, blur radius 80–120
- Do not animate these — static atmosphere only

---

## File Structure

```
/
├── CLAUDE.md                          ← This file
├── apps/
│   └── mobile/
│       ├── CLAUDE.md                  ← Mobile-specific context
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── index.tsx          ← Today screen
│       │   │   ├── week.tsx           ← Week view
│       │   │   ├── ai.tsx             ← AI Hub
│       │   │   └── settings.tsx       ← Settings
│       │   ├── onboarding/
│       │   │   ├── index.tsx
│       │   │   ├── connect.tsx
│       │   │   └── profile.tsx
│       │   └── _layout.tsx
│       └── components/
│           ├── ui/                    ← shadcn-inspired primitives
│           ├── schedule/              ← River, timeline, blocks
│           ├── tasks/                 ← Task cards, difficulty display
│           └── ai/                    ← Chat UI, AI Hub components
├── packages/
│   ├── shared/
│   │   ├── types/                     ← All TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   └── layout.ts
│   │   ├── prompts/                   ← AI prompt templates (versioned)
│   │   │   ├── grader.ts              ← Gemini Flash grader prompt
│   │   │   └── copilot.ts             ← Claude Sonnet copilot prompt
│   │   └── supabase.ts                ← Supabase client (STUB — backend owns)
│   └── trigger/
│       └── src/jobs/                  ← Trigger.dev jobs (STUB — backend owns)
│           ├── daily-trigger.ts
│           ├── batch-grader.ts
│           └── sunday-briefing.ts
```

---

## TypeScript Interfaces

All shared interfaces live in `/packages/shared/types/index.ts`.
**Never define types inline in components.** Import from shared.

Key interfaces to always reference:

```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  subject: string;
  source: 'google_classroom' | 'canvas' | 'manual' | 'photo';
  externalId?: string;
  dueDate: string; // ISO 8601
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  taskType: 'essay' | 'problem_set' | 'reading' | 'project' | 'study_guide' | 'quiz_prep' | 'other';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledBlock {
  id: string;
  userId: string;
  taskId?: string;
  task?: Task; // joined
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: 'shadow' | 'approved' | 'completed';
  day: string; // YYYY-MM-DD
  createdAt: string;
}

interface FixedEvent {
  id: string;
  userId: string;
  title: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  daysOfWeek: number[]; // 0=Sun, 6=Sat
  recurrenceRule?: string;
  color?: string;
  createdAt: string;
}

interface Guardrail {
  id: string;
  userId: string;
  ruleType: 'no_work_after' | 'buffer_after_event' | 'max_hours_per_day';
  value: Record<string, unknown>; // jsonb
  active: boolean;
  createdAt: string;
}
```

---

## AI Architecture (Reference Only — Do Not Implement Calls)

When building UI that involves AI, stub the call and leave a TODO.

**Dual-model routing:**
- **Gemini 2.0 Flash** → bulk operations: assignment grading, photo OCR
- **Claude Sonnet** → user-facing: conversational copilot, schedule reasoning

**Pipeline A — Daily Trigger** (Trigger.dev cron job — DO NOT IMPLEMENT):
`Fetch → Normalize → Grade (Gemini) → Schedule (deterministic) → Shadow Draft → Push Notify`

**Pipeline B — Vision OCR** (Supabase Edge Function — DO NOT IMPLEMENT):
`Photo → Gemini Flash Vision → Structured JSON → User Confirm → Enter Pipeline A at step 3`

**Pipeline C — Conversational Copilot** (Supabase Edge Function — DO NOT IMPLEMENT):
`User input → Assemble context payload → Claude Sonnet → JSON action + NL confirmation → User confirm → Write to DB`

**⚠️ The scheduling engine is DETERMINISTIC — it is never an LLM.**
The greedy slot-filling algorithm runs in pure TypeScript with no AI calls.

---

## Coding Rules

1. **TypeScript everywhere.** No `any`. No `unknown` unless genuinely necessary.
2. **StyleSheet.create** for all styles — never inline style objects in JSX.
3. **NativeWind v4 syntax** — always use `className` prop, never `style` for
   Tailwind classes. NativeWind v4 is a breaking change from v3; use v4 patterns:
   ```tsx
   // ✅ Correct — NativeWind v4
   <View className="flex-1 bg-[#0A1118] px-7" />

   // ❌ Wrong — NativeWind v3 / old pattern
   <View style={tw`flex-1 bg-[#0A1118]`} />
   ```
   Use `StyleSheet.create` only for dynamic values (e.g. animated styles,
   values computed at runtime) that cannot be expressed as static Tailwind classes.
4. **Expo SDK 54 only.** Never suggest deprecated APIs. Key SDK 54 patterns:
   - Camera: `expo-camera` v17 with `CameraView` component (not legacy `Camera`)
   - Router: `expo-router` v6 — use `useRouter()`, `<Link>`, `router.push()`
   - Notifications: `expo-notifications` v0.32+
   - Image: `expo-image` v3 (not `Image` from `react-native`)
   - React: 19.1.0 (not 18.x)
   - React Native: 0.81.5
5. **Expo Router** file-based navigation. Never use React Navigation directly.
6. **No hardcoded strings** for colors, spacing, or font weights — import from constants.
7. **Component scope:** One component per file. Under 200 lines. Extract sub-components early.
8. **Hook pattern:** All data fetching lives in `useXxx()` hooks. Components are
   display-only — they receive props or call hooks, never fetch directly.
9. **AI prompts** stored in `/packages/shared/prompts/` — never inline in components or jobs.
10. **Naming:**
    - Variables/functions: `camelCase`
    - Components/types: `PascalCase`
    - Database columns (in TODO comments): `snake_case`
    - Files: `PascalCase.tsx` for components, `camelCase.ts` for hooks/utils

---

## Definition of Done — Screen Completion Checklist

A screen is **not done** until every item on this list is true. Do not hand off
a screen without confirming each point.

**Structure**
- [ ] File exists at the correct Expo Router path from the Screen Inventory
- [ ] All imports reference shared types, constants, and components — no local redefinitions
- [ ] No inline style objects — all styles via NativeWind `className` or `StyleSheet.create`
- [ ] No hardcoded hex colors — all colors imported from `Colors` constant

**Data layer**
- [ ] Every data dependency has a typed `useXxx()` hook in `/apps/mobile/hooks/`
- [ ] Every hook has a `// TODO: Supabase` comment with the exact query needed
- [ ] Mock data is realistic and matches the TypeScript interface exactly
- [ ] Every hook returns `{ data, loading, error }` shape

**UI states**
- [ ] **Loading state** — skeleton or spinner shown while `loading === true`
- [ ] **Error state** — human-readable error message with a retry action
- [ ] **Empty state** — meaningful empty message (not a blank screen) when `data` is empty
- [ ] **Populated state** — the happy path renders correctly with mock data

**Design**
- [ ] Dark background (`#0A1118`) applied at screen level
- [ ] `28px` horizontal screen padding applied
- [ ] Ambient gradient orbs present (2–3, using `#A8DADC` / `#457B9D` at low opacity)
- [ ] Typography weights match the spec (300/400/500/600/700 — no arbitrary values)
- [ ] Fixed events render as hollow ghost dots; AI tasks render as filled glow dots

**Navigation**
- [ ] Any navigation actions use `useRouter()` from `expo-router`
- [ ] Back navigation works correctly
- [ ] Tab bar active state reflects the correct tab

---

## Screen Inventory (Build Priority)

### P0 — Launch Blockers
| Screen | Route | Status |
|---|---|---|
| Today View | `/(tabs)/index` | 🔴 Not started |
| Week View | `/(tabs)/week` | 🔴 Not started |
| AI Hub | `/(tabs)/ai` | 🔴 Not started |
| Chat Sub-view | `/(tabs)/ai/chat` | 🔴 Not started |
| Settings | `/(tabs)/settings` | 🔴 Not started |
| Onboarding — Welcome | `/onboarding/` | 🔴 Not started |
| Onboarding — Connect | `/onboarding/connect` | 🔴 Not started |
| Shadow Schedule Review | `/schedule/review` | 🔴 Not started |

### P1 — Post-Launch
| Screen | Route |
|---|---|
| Connections Hub | `/settings/connections` |
| Guardrails Editor | `/settings/guardrails` |
| Aura's Brain Viewer | `/settings/brain` |
| Task Detail / Edit | `/tasks/[id]` |
| Post-Task Feedback | `/tasks/[id]/complete` |
| Sunday Briefing | `/briefing` |

---

## What You Must Never Do

- ❌ Write Supabase queries or client calls — stub with TODO comments
- ❌ Write Trigger.dev job implementations — stub with TODO comments
- ❌ Use an LLM for the scheduling algorithm — it is pure deterministic TypeScript
- ❌ Suggest Next.js, Remix, or any web framework — MVP is mobile-only
- ❌ Use inline style objects in JSX — use StyleSheet.create
- ❌ Hardcode color hex values in components — import from Colors constant
- ❌ Use scraping or credential-relay for school portals — official APIs only
- ❌ Use generic variable names: `data`, `result`, `response` — be specific
- ❌ Skip loading/error/empty states in any data-driven component
- ❌ Suggest pgvector for MVP velocity tracking — rolling average on task_completions is sufficient
