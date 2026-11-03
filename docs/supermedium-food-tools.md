# Supermedium food logging

`lookup_food` checks personal foods before Open Food Facts or USDA. Search saved foods by exact barcode, name, brand + name, or an explicit alias. Broad provider searches return candidates, not a confirmed selection. Complete candidates are cached by provider ID/barcode without overwriting corrected recipes. Missing nutrients remain null and are not cached as complete foods.

Provide `portionGrams` or `count` + `unit`. Each match's `savedFood` contains its reusable serving record; `macrosPerServing` refers to that record's serving. A 100g reference without a known household serving cannot be treated as one bowl/bar. Mass and volume are never silently converted. `providerServingSize` preserves the provider label when the cached reference basis differs.

Provider 5xx responses retry once after 300ms, then try the other provider. Both providers have bounded request timeouts. `provider_down` includes provider failure reasons; `not_found` means completed searches found no match. After an outage, log an explicitly labelled estimate with `confidence: "low"` and `needsRecheck: true`. Re-check later with lookup, then patch the entry. No automatic re-check job is scheduled.

USDA requires `USDA_API_KEY` in Vercel production. If absent, OFF and personal foods still work and fallback failures identify `not_configured`. See [USDA API guide](https://fdc.nal.usda.gov/api-guide/) and [key signup](https://fdc.nal.usda.gov/api-key-signup/). OFF serving and package conversions use its reported data; see [OFF API documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/).

## Save or correct a reusable food

`save_food` saves a confirmed label, restaurant dish, or estimate. Supply name, servingSize, macrosPerServing, source and optionally brand, barcode, aliases, gramsPerServing or unitsPerServing. For corrections, pass the existing foodId and the full corrected record. Existing meals are snapshots and never change with the library.

Logging a meal/item with `estimateConfirmed: true` automatically saves that user-confirmed estimate on first use. Never infer confirmation. A saved estimate retains its uncertainty; library reuse alone does not make it high confidence. `lookup_food` is annotated as a non-destructive write because it now populates this cache. `save_food` is also non-destructive.

## Itemized meals

`log_meal` accepts optional `items`. Each item has name, quantity, unit (default serving), **per-unit** macros, source, optional foodId/confidence/needsRecheck. The server multiplies by quantity and computes the meal's totals. Returned items have stable ids.

```json
{
  "name": "Breakfast",
  "quality": 8,
  "items": [{
    "name": "Toast",
    "quantity": 2,
    "unit": "slice",
    "macros": { "calories": 100, "protein": 4, "carbs": 18, "fat": 2 },
    "source": "label"
  }]
}
```

`update_entry` can edit one item without resending the meal:

- Add: `{"id":"MEAL_ID","itemChange":{"action":"add","item":{...}},"requestId":"stable-unique-id"}`.
- Change quantity: `{"id":"MEAL_ID","itemChange":{"action":"replace","id":"ITEM_ID","item":{"quantity":3}}}`.
- Remove: `{"id":"MEAL_ID","itemChange":{"action":"remove","id":"ITEM_ID"}}`.

`replace` patches that item. Supplied macros replace all four per-unit macros. Reuse requestId only for an exact retry. Changing an item's nutrition/source without new confidence resets inherited confidence; quantity-only changes retain it. `fields.items` replaces the entire array, while aggregate macros of an itemized meal cannot be patched directly. Adding an item to a legacy aggregate meal preserves the prior total as one snapshot item. Legacy meals without items remain editable with aggregate macros.

Meal writes reopen affected food-day completion flags. The user must explicitly confirm all intake before `mark_food_day_complete` is called again.

## Confidence and maintenance

Default confidence is high for provider/label nutrition, medium for restaurant estimates and low for photo/other estimates. Saved foods retain their original confidence. Reports split calorie amounts by confidence and return lowConfidencePercent/recheckCalories for each logged day. These are amounts in the log, not proof that the day is complete.

`log_meal` and all write responses include `day.maintenance`, `day.calorieBudget`, and `day.remaining`. `get_summary` exposes maintenance plus the selected day's budget (`day` for a day summary, `asOfDay` for a week/month). `get_remaining` uses the same calculation.

Maintenance reports `coverage`, `requirements`, and `stillNeeded`: 14 consecutive explicitly complete days, 6 distinct weigh-in dates spanning at least 10 days, including at least 3 in each end week. Only finished days are eligible. This remains a provisional estimate with existing uncertainty guardrails.

A chosen calorie target takes precedence. With no target and a usable estimate, calorieBudget.basis is `maintenance_estimate` and remaining calories use that estimate. With neither, remaining calories stay null. This never changes the saved target.

## Deployment and verification

Schema changes are additive: a new foods table and optional meal fields. No historical backfill is needed. If handlers must be rolled back after itemized meals are logged, retain the additive schema and totals; do not deploy an older schema that rejects the new fields.

Run `npm run check:fitness`, the production build, and `node scripts/fitness/check-food-local.mjs` against local Convex plus the app at app.localhost:3001. That acceptance script rejects production hosts, removes its meal/weight fixtures, and retains clearly named local library fixtures. Production verification is read-only via `scripts/fitness/check-production.mjs`.
