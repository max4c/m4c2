# Fitness in the existing m4c2 site

The fitness tracker now lives in this Next.js repository and uses the existing Vercel project. Do not deploy the old standalone Supermedium dashboard or Worker.

## Supermedium: access and phone use

The app is named **Supermedium**, at `https://app.maxforsey.com`. The public site keeps its existing URLs and analytics on its separate origin.

- Sign in with the password saved in ignored `.vercel/fitness-links.md`. A Secure, HttpOnly, SameSite=Strict, host-only signed cookie remembers the device for 30 days. Sign out clears it.
- The password is stored as a salted scrypt hash. Login attempts are limited to ten per 15 minutes per client; Vercel's overwritten forwarded IP is HMAC-hashed before storage in Convex. Expired limiter rows are cleaned up.
- The old dashboard URL capability has been rotated. The browser no longer stores the Convex read token or sends it in image URLs. Data and photos are served through authenticated same-origin routes; dashboard data refreshes every 30 seconds and on returning to the tab.
- The MCP credential is separate and unchanged. Claude/ChatGPT cannot log in with the dashboard password; use the private connector URL. Do not share that URL.
- iPhone: open in Safari, use Share → Add to Home Screen. No offline health-data cache or service worker is used.
- Calendar: daily logged calories and workout markers, month navigation, and a selectable day's workout sets. A dash means no meals logged, not zero intake.
- Tap an exercise for all recorded sessions, heaviest set and its reps, best performance at each weight, best session volume, and lifetime volume. Weighted volume is entered pounds × reps, without doubling dumbbell loads. Timed/carry entries use seconds/metres and do not claim lifting-volume records.
- Logging happens through the connected chat when the user supplies actual exercises, sets, weights, reps, meals, or measurements. The system does not automatically observe workouts or infer that planned sets were completed.

## Existing deployment access

The Vercel account `max4c` (signed in through signal@maxforsey.com) has access to the existing **m4c2** project under **max4cs-projects**. The tracker was deployed and promoted on 2026-10-28, preserving existing production environment variables and the public website.

Production deployment: `dpl_44QALthhrTz2WUod6FTJCHXdSc2X` (`m4c2-kldrnnz6o-max4cs-projects.vercel.app`). Production Convex: `https://quiet-yak-684.convex.cloud`, personal team `max-2cecb`, project `m4c2-fitness`. The plan is seeded; production contains no synthetic meals or workouts.

Vercel has accepted `app.maxforsey.com` on that same project. **DNS saved:** Namecheap CNAME host `app` points to `eaaac8f527c1c804.vercel-dns-017.com`, TTL Automatic. Authoritative DNS and Cloudflare public DNS both return the record. Apex and www records were preserved. HTTPS and read-only production MCP acceptance passed.

Private dashboard and MCP links are saved locally in ignored `.vercel/fitness-links.md`. Credentials live in ignored `.vercel/fitness-production.json` and the relevant production environments; never commit these files.

## Environment

Keep existing Vercel environment variables, including newsletter/analytics settings. Add these to the same project's production environment:

| Variable                                   | Purpose                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `FITNESS_APP_HOST`                         | Confirmed app hostname, no scheme/path                     |
| `DASHBOARD_ORIGIN`                         | `https://` + that hostname                                 |
| `NEXT_PUBLIC_CONVEX_URL`                   | Production Convex URL; available at build time             |
| `CONVEX_URL`                               | Same production Convex URL for server tools                |
| `CONVEX_SERVICE_TOKEN`                     | Separate random write credential, at least 32 characters   |
| `MCP_PATH_TOKEN`                           | Random connector URL token, at least 32 characters         |
| `DASHBOARD_TOKEN`                          | Server-only Convex read credential, at least 32 characters |
| `SUPERMEDIUM_PASSWORD_HASH`                | scrypt salt:hex-hash for dashboard sign-in                 |
| `SUPERMEDIUM_SESSION_SECRET`               | Random session signing secret, at least 32 characters      |
| `R2_ACCOUNT_ID`                            | Existing Cloudflare account for progress-photo storage     |
| `R2_BUCKET`                                | Private bucket name; defaults to supermedium-progress      |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Bucket-scoped R2 object credentials                        |
| `USDA_API_KEY`                             | FoodData Central API key                                   |

Never set `NEXT_PUBLIC_FITNESS_TEST_DATA=true` in production or use the anonymous local Convex deployment. No token should have a `NEXT_PUBLIC_` prefix. No Cloudflare Worker or Pages project is needed: Next.js serves the MCP transport and signs R2 PUT/GET requests directly. R2 remains the requested photo store, and Convex remains the requested database.

Set `CONVEX_SERVICE_TOKEN` and `DASHBOARD_TOKEN` to the same respective values in the production Convex environment. Deploy `convex/` and seed with `fitness:seed` before using the tracker. The original plan and all logging/progression behavior are retained. The calorie target remains null until supplied by the user.

Once production Convex, environment variables, and the domain are configured, use the existing site's Git/Vercel release flow or `vercel --prod`. Run the acceptance flow against the actual domain before claiming live completion. Run `node scripts/fitness/check-production.mjs` after DNS resolves. It only reads production data and checks the HTTPS endpoint, host isolation, invalid tokens, and MCP discovery.

## Both chat clients

Use exactly the same connector URL:

```text
https://APP_HOST/mcp/<MCP_PATH_TOKEN>
```

Claude: Settings → Connectors → Add custom connector. ChatGPT: Settings → Apps/Connectors → Developer mode → create connector, authentication **No Authentication**. The secret is in the URL path, with no Authorization header. Tools fetch the live plan instead of relying on model memory.

The model handles voice and food/menu photos. R2 upload URLs still require a client/helper capable of PUTting the actual image bytes; returning a URL alone does not upload a chat attachment. There is no capture UI.

## Local development and checks

```sh
npm ci
CONVEX_AGENT_MODE=anonymous npm run dev:convex
# Keep Convex running; another terminal:
node scripts/fitness/setup-local.mjs
node scripts/fitness/fixture.mjs  # optional synthetic LOCAL data only
npm run dev
```

The setup script reads the local Convex URL generated in `.env.local`, sets independent local credentials, and seeds the plan. It sets the local app hostname to `app.localhost`, test-data labeling on, and rotates tokens if rerun. Local app: `http://app.localhost:3000/#token=<DASHBOARD_TOKEN from .env.local>`. Public site: `http://localhost:3000`.

```sh
npm run check:fitness
npm run lint
npm run build
node scripts/fitness/smoke.mjs
npx playwright install chromium
node scripts/fitness/visual-check.mjs
```

The existing newsletter routes require `RESEND_API_KEY` even during build; use the existing deployment value. Local verification may use `RESEND_API_KEY=re_local_build_placeholder npm run build` without exercising newsletter sends. This placeholder must not be deployed.

Smoke/visual scripts write synthetic data and refuse a nonlocal Convex URL. Evidence is under ignored `.daso/evidence/fitness/`: phone, desktop, meal cards, locked view, and flow video. Public homepage/blog/about/wiki are exercised too.

## Validation recorded

- Existing Next.js production build compiles and generates all 70 pages (using a local build-only newsletter placeholder).
- 31 tests pass: progression, persistence, capability auth, food lookup behavior, and app/public host separation.
- Real MCP SDK client exercises the Next.js transport and local Convex, all six log types, retries, remaining nutrition, progression, summary, raw queries, and rejection cases.
- Browser checks cover 320/390/430px, date-range controls, local link persistence, forgetting the device, reactive updates, no fitness analytics, and existing public routes.
- Production Vercel build and promotion succeeded; live public homepage and blog both return HTTP 200.
- Production Convex deployment, plan seed, authenticated plan/session/dashboard reads succeeded, with zero synthetic health records.
- App-domain HTTPS, hostname isolation, invalid-token rejection, 15-tool discovery, and production plan/session/nutrition/summary reads passed. Actual Claude/ChatGPT client connections remain to be checked.
- Private R2 bucket `m4c2-fitness-progress` is created in account `9a590903eff0397334ea6569e4f0d735`, with public access disabled. The approved `m4c2-fitness-photos` credential has object read/write access only to this bucket and is stored in Vercel production. Direct private PUT/GET, anonymous rejection, deployed authenticated image retrieval, and invalid-token rejection passed. The temporary test image was removed; no health records were inserted. USDA_API_KEY remains unconfigured; USDA food search is unavailable.

## Expanded history tools and verification

`get_exercise_history(name)` returns all logged sessions and records for one normalized exercise name. `get_summary(period, asOf)` supports historical days/weeks/months: use last Sunday's date for last week. Refresh tools in an already-added connector to discover the new history tool.

Password verification, tampered/expired/rotated sessions, per-client persistent throttling, historical summary dates, and exercise records are covered by automated tests. Two independent reviewers checked authentication and history aggregation; their global-throttle and duplicate-exercise findings were fixed. A real local phone-size browser check covered wrong password, successful login, reload, Monday calendar selection, curl records, and sign-out using synthetic local data only.

Live production password sign-in, Secure/HttpOnly cookie, anonymous-data rejection, incorrect password, cross-origin login rejection, MCP discovery (15 tools), get_exercise_history and historical summaries passed. Live mobile browser sign-in succeeded; public blog remains HTTP 200.

## Weekly overview

The Weekly phone tab supports all recorded weeks, with previous-week context. It includes lifting sessions, exercise occurrences (once per exercise per lift date), distinct exercises, sets, easy/hard cardio sessions and their activities, movement days, total steps and average logged-day steps, meal counts, calories/macros, meal quality, supplements by item, weight check-ins and averages, tape measurements, photos, and hard sets by muscle.

Normal steps means average logged-day steps in the 28 days before the selected week, with baseline coverage shown. Missing steps/nutrition produce null logged-day averages; explicit zero-step days count. Existing top-level proteinAvg/calorieAvg/stepsAvg fields retain elapsed-calendar-day denominators. get_summary exposes the same expanded metrics to chat clients. The current partial week is labeled and prior-week comparisons explicitly cover the full prior week.

## Split sessions and deletion

Lift totals count distinct logged dates. Same-date lifting rows are merged by normalized exercise name, with sets concatenated in timestamp order, for progression and exercise history. Deload rows remain visible in history but are excluded from the progression baseline before merging. Movement/streak/rest advisories count dates.

Rotation advances at most once per date and normalized Push/Pull/Upper label. Persistent advancement markers survive row deletion; deletion never rewinds rotation. Existing same-date valid rows also prevent a duplicate advancement.

`delete_entry(table, id)` deletes one logged row. Query first to confirm `_id`, or use a log result's `id`. Only the seven logging tables are allowed, IDs must belong to the selected table, and the service token is required. Repeating deletion returns `deleted: false`. Deleting a photo entry removes its database row, not the R2 object. Refresh connector tools after changes (currently 18 tools including `update_entry`).

## October 30 routine and rest timer

The user-approved plan is applied from `shared/routine-october.ts` using `node scripts/fitness/apply-october-routine.mjs` (local) or `--production` (explicit existing production deployment). The script backs up the previous plan under ignored `.vercel`, changes only program/rotation/schedule/rules/rationale, and verifies goals, targets and next session are preserved. To roll back the initial update, use the backed-up program/rationale with rotation `["push","pull","upper"]`, schedule `[]` and rules `[]` through `update_plan`; do not alter workout rows or advancement markers. Reconcile the next rotation explicitly if workouts were logged after migration.

The intended week is Mon Push, Tue Pull, Wed HIIT, Thu Upper, Fri Legs, Sat soccer, Sun easy jog/rest. Lifting follows Push → Pull → Upper → Legs even when weekdays move. Cardio never advances it. Legs is a full session now. The extra-day policy and effort/warm-up/superset rules are saved in the plan, returned to chat clients, and visible under Routine → Session rules.

Exercise prescriptions carry rep ranges, rest durations, categories, optional superset groups, added-load conventions and progression policies. Double progression uses each exercise's range. Unknown equipment increments produce a load-selection instruction instead of an invented numeric increase. Sets below a new range request a lighter load. Heavy 4–6-rep pull-ups have separate history from Pull-day pull-ups. Explicit aliases preserve renamed dip/raise/carry histories without rewriting logs. Jumps prioritize quality, bodyweight abs progress reps, and carries use metres. Legacy plans still parse with their prior defaults.

Rest controls appear in Today and Routine. Only the second exercise of the arm superset offers the pair timer. One local timer persists across navigation/reload using a wall-clock deadline and catches up after browser suspension. Timer controls do not log sets. See the November timer behavior below for the current view and alerts.


## Entry corrections, totals, and food portions

`update_entry(id, fields, requestId?)` infers one of the seven log tables from the row ID and patches only supplied fields. Meals remain whole entries: add toast by supplying the updated meal name and absolute total macros. Omitted fields are retained; supplied exercises/items arrays replace those arrays. `null` clears optional workout duration/distance. Protected state and fields from other tables are rejected. Workout edits preserve rotation/recovery; original and corrected date/label markers prevent later fragments from advancing twice. Edits do not recompute the live rotation.

Every `log_*`, `update_entry`, and `delete_entry` response includes the current saved entry (null after deletion), local `date`, and `day` with nutrition totals, live calorie/protein targets, remaining amounts, and movement totals/coverage. Carbs/fat targets remain null because the plan does not define them. Movement goals are explicitly weekly. Date corrections also return `previousDay`. Retry receipts retain the operation result but recompute current totals and the current entry; a reused edit request ID cannot overwrite a newer correction. Minimal deletion receipts retain only row ID, table and date so deletion retries report the original day's totals.

Workouts optionally store `durationMin`, `distanceMi`, and `distanceMiMax` (upper bound for a reported range). A 50-minute walk uses durationMin=50; a 3–4-mile hike uses distanceMi=3, distanceMiMax=4. Summary totals include known values and coverage; missing duration/distance is null, not zero. Do not repeat an entire session's duration on every live-log fragment. Lifting sessions still count distinct dates.

For a current log, omit date and ts. The server stamps the time and derives the local date in plan.timezone, default America/Los_Angeles. Change timezone through update_plan when needed; changing it never shifts historical dates. Steps now get a timestamp too; old steps rows remain valid.

`lookup_food` accepts either portionGrams or count + unit (including fractional counts). Open Food Facts serving and package metadata resolves supported household units; no piece weight or liquid density is guessed. Serving label, grams/ml per serving, and calories per piece appear when supported. Different preparation variants produce warnings, including a twofold calorie-per-piece discrepancy. Ambiguous labels/multipacks stay unresolved and need grams or a label. USDA generic search still needs grams for nutrition scaling.

All reads advertise readOnlyHint=true. All logs and update_entry share the same non-destructive annotations; only delete_entry advertises destructiveHint=true, per the user's requested connector policy. Client approval settings still control prompts.

Verification: `npm run check:fitness`, `node scripts/fitness/check-entry-local.mjs`, and a production build. The local script exercises the actual HTTP MCP server/Convex database, validates discovery and rejected edits, performs/cleans up synthetic logs, and reads a real OFF product. Production checks only read health records. Schema additions are compatible with existing records and need no backfill. Web rollback can keep the new backend; a backend rollback must retain optional columns and deletion receipts so newly logged records remain valid.

## Maintenance estimation and exercise-name suggestions

MCP now exposes 20 tools, including `mark_food_day_complete` and `estimate_maintenance`. The deployed server must advertise both; a stale chat may need connector rediscovery/new chat after deployment. `get_remaining` points to the estimator when the calorie target is unset and keeps the remaining-calorie budget null.

Only explicit user confirmation closes a food day. `mark_food_day_complete({date?, complete?, confirmZeroIntake?, requestId?})` defaults to local today and complete=true; complete=false reopens it. An empty day cannot be closed without explicit zero-intake confirmation. Meal additions, edits and deletions reopen affected days, including both dates for a moved meal. Log/edit/delete day totals and day summaries expose foodLog.complete and needsReconfirmation. Stable request IDs prevent an old completion retry from closing a day after later edits. Completion metadata lives separately in foodDays; no historical days are automatically marked complete.

`estimate_maintenance({asOf?, days?})` is read-only. It considers finished calendar days, ending yesterday by default in plan.timezone, within a 28-day window (configurable 14–56). It uses the most recent contiguous explicitly complete run of at least 14 days, with at least 3 distinct weigh-in dates in each endpoint week, at least 6 overall spanning 10 days. Same-day weights collapse to a median. Weight trend is the median of pairwise slopes at least 3 days apart; maintenance is average intake minus 3500 times daily weight change in pounds, rounded to 50 kcal. This is a disclosed, unvalidated short-window approximation with low confidence; the linked Hall papers explain limitations and do not validate this algorithm or readiness thresholds. Missing days are never assumed zero or bridged. The response reports selected dates, staleness, coverage, missing data and assumptions. Unusual trends (>1% body weight/week) or implied values outside 1000–6000 kcal/day return no estimate; those are conservative product guardrails, not medical thresholds. No estimate automatically changes plan targets. Rollback can leave the additive foodDays table in place.

Workout log/edit results include exerciseNameMatches from the saved plan and prior rows (excluding the written row). Exact normalization and existing explicit aliases retain their established behavior; fuzzy spelling, plural and DB/dumbbell comparisons only suggest up to 3 existing names. Suggestions do not rewrite data or join progression histories. Confirm the movement before correcting an exercises array; different curl positions/equipment and heavy/moderate pull-ups stay distinct.

Verification includes pure stable/gaining/losing trend fixtures; missing and incomplete days; duplicate, clustered and outlier weights; completion/retry/date-change semantics; authorization and unchanged targets; and actual local MCP calls through `node scripts/fitness/check-maintenance-local.mjs`. Its synthetic food, weight and workout rows are local only and cleaned up after the run. Production checks discover both tools and read readiness without marking any real day complete.

## Voice sessions (November 2026)

Use `get_current_session` to orient, then `log_set` for each spoken work set. Each set needs a generated unique `requestId`; an exact retry reuses it. The response contains day totals plus `session.rest`, `session.next` (load, reps, set number, warm-up cue) and `session.exercisesLeft`. Qualitative `effort` preserves “easy”/“at the limit” without inventing a numeric RIR. Only the first prescribed N sets drive progression.

`swap_exercise` reorders today's work or chooses its configured backup, keeping actual movement history separate. `set_next_session_note` stores a cue for one subsequent session. `rename_exercise` preserves history and aliases; merging existing names requires explicit same-movement confirmation. Load conventions are `total`, `platesOnly`, `perDumbbell`, and `addedToBodyweight`.

The Today screen is read-only. Its authenticated SSE connection bridges a Convex subscription; the dashboard token stays on the server. A new set preloads rest without starting it, and a superset waits for its partner. Starting rest opens the dedicated `#timer` screen; the dock also links to it. It shows a large countdown, the exercise and the next set/target. Presets of 60/90/120/180 seconds are available before starting, with Stop while running and no extra-time buttons. An absolute deadline survives navigation, tab suspension and reload. While the timer screen is visible and counting down, Screen Wake Lock requests that the display stay on and reacquires on visibility changes. Browsers or battery-saving settings can deny this request. The user chose to keep Supermedium as a website; no native app or live Lock Screen countdown is provided.

For optional background notifications, configure `VAPID_PUBLIC_KEY` in Vercel and both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Convex. Generate this key pair once and keep the private key out of git. On iPhone, open the Home Screen app's Timer screen, expand **Completion alert**, and tap **Enable notifications**. Convex schedules a Web Push at the deadline; cancellation/replacement updates the service worker's active version to reject stale pushes. The notification contains no exercise or health data. iOS controls delivery, sound and vibration; this is not a guaranteed native Clock alarm. Foreground sound, scheduling/cancellation, stale-push filtering and the live session flow are tested; actual locked-iPhone delivery still needs a real-device check.

`npm run check:fitness` covers the Nov 2 target replay, append/retry behavior, supersets, swaps, notes and renames. `node scripts/fitness/check-voice-local.mjs` uses the real local MCP and SSE endpoints and leaves clearly marked synthetic session data for UI checks. It requires the local test password `voice-test-only`; it refuses a non-local backend. `node scripts/fitness/check-production.mjs` performs read-only live checks.

The one-time `upgrade-voice.mjs --production` enriches the existing plan, preserves the Nov 2 sets, records only reported qualitative effort, and moves dated setup cues into one-use notes. It saves the original plan and row to ignored `.vercel/voice-before-production.json` before changing them. Restore that plan through `update_plan` and that row's original exercises through `update_entry` if rollback is needed; rotation is not changed by the migration. Do not rerun it as a routine deployment step, because one-use notes would be refreshed.

## Mobile scanability (November 2)

Page headers keep the theme control in the same flex row as the heading or back link. The timer has no visible page title. Primary controls and disclosures use 48–56px touch targets; narrow calendars retain 44px-wide day buttons at 320px.

Today shows the next exercise/target once. Upcoming exercises and completed exercises are closed disclosures, while the active exercise retains its setup, logged sets, and one-use cue. Completing the session replaces the list with one expandable **Workout complete** row. Counts still come from the same live session data; no records are deleted or renamed. A finished rest can be restarted directly from Today. The daily log, weekly detail, and recent meals are collapsed; Routine opens the next session with the other sessions and weekly schedule available on tap. Sleep remains below the main daily content.
