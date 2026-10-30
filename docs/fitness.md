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

`delete_entry(table, id)` deletes one logged row. Query first to confirm `_id`, or use a log result's `id`. Only the seven logging tables are allowed, IDs must belong to the selected table, and the service token is required. Repeating deletion returns `deleted: false`. Deleting a photo entry removes its database row, not the R2 object. Refresh connector tools to discover `delete_entry` (16 tools total).

## October 30 routine and rest timer

The user-approved plan is applied from `shared/routine-october.ts` using `node scripts/fitness/apply-october-routine.mjs` (local) or `--production` (explicit existing production deployment). The script backs up the previous plan under ignored `.vercel`, changes only program/rotation/schedule/rules/rationale, and verifies goals, targets and next session are preserved. To roll back the initial update, use the backed-up program/rationale with rotation `["push","pull","upper"]`, schedule `[]` and rules `[]` through `update_plan`; do not alter workout rows or advancement markers. Reconcile the next rotation explicitly if workouts were logged after migration.

The intended week is Mon Push, Tue Pull, Wed HIIT, Thu Upper, Fri Legs, Sat soccer, Sun easy jog/rest. Lifting follows Push → Pull → Upper → Legs even when weekdays move. Cardio never advances it. Legs is a full session now. The extra-day policy and effort/warm-up/superset rules are saved in the plan, returned to chat clients, and visible under Routine → Session rules.

Exercise prescriptions carry rep ranges, rest durations, categories, optional superset groups, added-load conventions and progression policies. Double progression uses each exercise's range. Unknown equipment increments produce a load-selection instruction instead of an invented numeric increase. Sets below a new range request a lighter load. Heavy 4–6-rep pull-ups have separate history from Pull-day pull-ups. Explicit aliases preserve renamed dip/raise/carry histories without rewriting logs. Jumps prioritize quality, bodyweight abs progress reps, and carries use metres. Legacy plans still parse with their prior defaults.

Rest controls appear in Today and Routine. Only the second exercise of the arm superset offers the pair timer. One local timer persists across navigation/reload using a wall-clock deadline, with +30s and cancel. It catches up after browser suspension. A completion tone requires an active audio context and visible app; there is no promised iPhone lock-screen alarm or background notification. Timer controls do not log sets.
