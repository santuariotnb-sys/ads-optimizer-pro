# Security & Bug Audit Final
Date: 2026-03-29

## Build: PASS
- `npm run build` succeeds (376ms, no errors)
- `npx tsc --noEmit` succeeds (0 errors)
- No TS6133 (unused import) warnings

## Security

### API Keys: EXPOSED — CRITICAL
1. **`.env` contains REAL production keys** that were committed or are at risk:
   - `VITE_ANTHROPIC_API_KEY=sk-ant-api03-f5ZU-...` — real Anthropic key
   - `VITE_META_APP_SECRET=d8888dd1cf2b1806e59b2f17832a8f20` — real Meta app secret
   - `VITE_SUPABASE_ANON_KEY=eyJhbG...` — Supabase anon key (lower risk, RLS-protected)
2. **`.env` IS in `.gitignore`** — good, but if it was ever committed historically, keys are burned.
3. **`VITE_ANTHROPIC_API_KEY` is exposed in the frontend bundle** — any VITE_ prefixed var is embedded in the client JS at build time. Found in 3 files as fallback:
   - `src/components/Agent/Agent.tsx:342`
   - `src/components/CreativeVision/CreativeVision.tsx:47`
   - `src/components/Overview/Overview.tsx:375`
4. **`VITE_META_APP_SECRET`** is NOT imported in any src/ file — safe (not in bundle).
5. No hardcoded `sk-ant-` or `eyJ` strings in src/ files — clean.

### XSS: SAFE
- Zero `dangerouslySetInnerHTML` usage
- Zero `innerHTML` usage
- All user inputs rendered via React JSX (auto-escaped)

### Auth Tokens: RISK — MEDIUM
1. **Meta access_token stored in `sessionStorage`** (`_ao_token`) — acceptable but not ideal. sessionStorage is accessible to any JS on the same origin (XSS vector).
   - `src/store/useStore.ts:62,95-96`
2. **No tokens in console.log** — clean.
3. **Anthropic API key in sessionStorage** (`ao_anthropic_key`, `ads_everest_vision_key`) — same XSS exposure risk.
   - `src/components/Agent/Agent.tsx:339-342`
   - `src/components/CreativeVision/CreativeVision.tsx:44-47,69`

### Network: ISSUES — LOW
1. **No AbortController anywhere** — zero instances in the entire codebase. All fetch calls in useEffect lack cleanup/cancellation.
2. **`http://localhost:5173`** fallback in `META_REDIRECT_URI` (`src/utils/constants.ts:2`) — fine for dev, but ensure production env var is always set.
3. **Fetch error handling is present** in `metaApi.ts` (checks `response.ok`, throws on error) — good.
4. **`anthropic-dangerous-direct-browser-access: true` header** in `aiAgent.ts:27` and `Overview.tsx:412` — this means the Anthropic API key is sent directly from the browser. Any user can see it in DevTools Network tab.

## Bugs Found

1. **[CRITICAL] `aiAgent.ts:42` — Unsafe data access without optional chaining**
   `return data.content[0].text` — if API returns empty content array, this throws `TypeError: Cannot read properties of undefined`. Compare with `Overview.tsx:417` which correctly uses `data.content?.[0]?.text`.

2. **[HIGH] `entityDetector.ts:27` — Division by zero**
   `return matches / len` — when both `hashA` and `hashB` are empty strings, `len = 0`, causing `NaN` return.

3. **[MEDIUM] `entityDetector.ts:15` — Division by zero**
   `groupCreatives.reduce(...) / groupCreatives.length` — if `groupCreatives` is empty (shouldn't happen given the grouping logic, but defensively unsafe).

4. **[LOW] `metaApi.ts:213-214` — Unsafe property access**
   `Object.keys(images)[0]` — if `images` is empty, `firstKey` is `undefined`, and `images[firstKey]` throws.

## Dead Code

### No-op onClick handlers (8 instances — buttons that do nothing):
1. `src/components/Integrations/Integrations.tsx:442` — "baixar" action button
2. `src/components/Integrations/Integrations.tsx:587` — "Adicionar Numero" button
3. `src/components/Integrations/Integrations.tsx:614` — "Testar" button
4. `src/components/Integrations/Integrations.tsx:621` — RefreshCw icon button
5. `src/components/PlatformAds/PlatformAds.tsx:231` — filter button
6. `src/components/PlatformAds/PlatformAds.tsx:239` — filter button
7. `src/components/PlatformAds/PlatformAds.tsx:247` — filter button
8. `src/components/PlatformAds/PlatformAds.tsx:277` — filter button

### Console.log in production (4 instances):
1. `src/services/localBridgeClient.ts:17-18` — in code comments/examples (harmless)
2. `src/services/gatewayService.ts:265` — `enableTestMode` debug log
3. `src/services/gatewayService.ts:266` — `disableTestMode` debug log

## Performance

1. **Lazy loading: WORKING** — 22 components lazy-loaded via `React.lazy()` in App.tsx. Good code splitting confirmed by build output (separate chunks).
2. **useMemo/useCallback usage: 47 instances across 15 files** — adequate coverage.
3. **No AbortController on any fetch** — could cause setState-on-unmounted-component warnings and wasted network requests during fast navigation.
4. **`Overview.tsx` handleGenerateReport uses useCallback with correct deps** — good.
5. **No large array copies on every render detected** — store selectors are granular.

## Score: 5/10

The Anthropic API key exposure in the frontend bundle is a showstopper. The key is billed per-token and anyone can extract it from the JS bundle.

## MUST FIX (before production)

1. **REMOVE `VITE_ANTHROPIC_API_KEY` from `.env`** — this key is embedded in the production bundle. Anyone visiting the site can extract it and run up your Anthropic bill. Use a backend proxy (Supabase Edge Function or Vercel serverless) to relay API calls.
2. **Rotate the exposed Anthropic key immediately** — assume it's compromised if ever deployed.
3. **Remove `VITE_META_APP_SECRET` from `.env`** — even though it's not in the bundle, it shouldn't be in a VITE_ prefixed var (confusing and risky if someone imports it).
4. **Fix `aiAgent.ts:42`** — add optional chaining: `data.content?.[0]?.text || 'Sem resposta'`
5. **Fix `entityDetector.ts:27`** — guard division by zero: `return len === 0 ? 0 : matches / len`

## SHOULD FIX (quality)

6. **Add AbortController to all fetch-in-useEffect patterns** — prevents race conditions and setState on unmounted components. Key files: `App.tsx:293`, `Overview.tsx:372`, `Agent.tsx:442`.
7. **Fix `metaApi.ts:213-214`** — guard against empty `images` object from upload response.
8. **Replace no-op `onClick={() => {}}` with either real handlers or remove the interactive element** — 8 instances in Integrations and PlatformAds that mislead users.
9. **Move console.log in gatewayService behind a DEBUG flag** — avoid leaking internal state in production.

## OK TO SHIP (cosmetic)

10. **sessionStorage for tokens** — acceptable for now, but consider in-memory-only storage for higher security.
11. **`http://localhost` fallback in META_REDIRECT_URI** — harmless in production as long as env var is set.
12. **localBridgeClient.ts console.log in comments** — not executed, just example code.
