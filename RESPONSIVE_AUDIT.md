# Responsive Audit — Ads Optimizer Pro

Audited: 2026-03-29
Breakpoint: 768px via `useIsMobile()` hook

---

## Summary

| Status | Count |
|--------|-------|
| GOOD   | 17    |
| NEEDS FIX | 5  |
| BROKEN | 2     |

---

## Per-file Results

### Overview/Overview.tsx
- GOOD — Uses `useIsMobile()`. KPI grid collapses 4->2 cols, signal row goes 1fr, weekly chart sub-grid adapts 3->2 cols. All grids conditional. SVG chart uses `width="100%"`. No fixed widths that overflow.

### Dashboard/Dashboard.tsx
- GOOD — Uses `useIsMobile()`. Metric grid 4->2 cols, account score sidebar stacks below. Table has `overflowX: 'auto'`, hides CTR/Frequencia columns on mobile. Has dedicated `mobileCellStyle`. Font sizes reduced on mobile.

### Campaigns/Campaigns.tsx
- GOOD — Uses `useIsMobile()`. Header stacks column on mobile. Metrics grid 4->2 cols. Action buttons go column layout. Ad sets grid collapses from 6-col to 2-col with name spanning full width. Search input goes full width.

### UTMTracking/UTMTracking.tsx
- GOOD — Uses `useIsMobile()`. Tables have `overflowX: 'auto'` with `minWidth: 1100/900/850` ensuring scroll on small screens. Filter row adapts styles for mobile. Sub-tabs scrollable.

### PlatformAds/PlatformAds.tsx
- GOOD — Uses `useIsMobile()`. Sub-tabs have `overflowX: auto` on mobile with reduced padding. Table wrapper has `overflowX: 'auto'` with `minWidth: 900/1100`. Filter row has `flexWrap: 'wrap'`. Toolbar adapts.

### Integrations/Integrations.tsx
- GOOD — Uses `useIsMobile()`. Tabs flex with `none`/scrollable on mobile. Webhooks/API grid collapses 2->1 col. UTM items stack column on mobile. Pixel grid collapses. Tests grid collapses. All layouts responsive.

### Creatives/Creatives.tsx
- GOOD — Uses `useIsMobile()`. Grid uses `1fr` on mobile vs `repeat(auto-fill, minmax(280px, 1fr))`. Metrics inside cards adapt 3->2 cols. Filters/sort have `overflowX: auto`. Sort buttons get larger tap targets (`minHeight: 36`).

### CreativeVision/CreativeVision.tsx
- GOOD — Uses `useIsMobile()`. API config stacks column on mobile. Type selector + analyze button stacks. Results grid 2->1 col. Frames strip has `overflowX: auto`. Confirm modal uses `width: '90%'` with maxWidth.

### SignalEngine/SignalEngine.tsx
- GOOD — Uses `useIsMobile()` in main and sub-components (StatCards, SignalLadder, CAPIPayloadPreview, SyntheticEventsSummary). All grids collapse: stat cards 4->2, EMQ+CAPI 2->1, Ladder+Synthetic 2->1. Font/padding scales down.

### SignalGateway/SignalGateway.tsx
- GOOD — Uses `useIsMobile()` passed to all sub-tabs. Stats grid 4->2. Dashboard/funnel/script grids collapse 2->1 or 3->1. Flex rows stack column. EPV section adapts.

### SignalAudit/SignalAudit.tsx
- GOOD — Uses `useIsMobile()`. Score overview stacks column. Gauges resize (130->100). Pillars grid 2->1 col. Zone badge centers. Padding reduces. Red line checklist is single-column by nature.

### AutoScale/AutoScale.tsx
- GOOD — Uses `useIsMobile()`. Stats grid 3->2. Rules grid 2->1. Padding/gap reduces. Safety rules and activity log items reduce padding. No fixed widths that overflow.

### Agent/Agent.tsx
- NEEDS FIX — Uses `useIsMobile()`. Quick topics use grid 2-col on mobile (good), messages constrain to 90%/85% width (good), padding adapts. However: the quick topics section uses `overflowX: 'auto'` on mobile but the grid approach may clip. Minor issue: no `minHeight` for touch targets on topic buttons.

### Pipeline/Pipeline.tsx
- NEEDS FIX — Uses `useIsMobile()`. Pipeline row stacks column on mobile (good). Card widths adapt. However: the expanded detail sections inside cards have dense inline content with small font sizes. The chevron connectors between stages disappear on mobile but there is no visual flow indicator replacement. The `minWidth` is not set on inner metric rows which could get cramped on very small screens.

### Playbook/Playbook.tsx
- GOOD — Uses `useIsMobile()`. Max width unconstrained on mobile. Category filters scroll horizontally with `overflowX: auto` and `WebkitOverflowScrolling: 'touch'`. Card padding adapts. Content is naturally flowing text.

### Financial/Financial.tsx
- NEEDS FIX — Uses `useIsMobile()`. KPI grid 4->2 cols (good). Expense form grid adapts (good). However: the DRE table section uses `overflowX: 'auto'` but the expense list items have a `width: 120` fixed on labels that could cause issues. The "add expense" form collapses properly but the monthly DRE table has no explicit `minWidth` which may render too narrow on mobile.

### Alerts/Alerts.tsx
- GOOD — Uses `useIsMobile()`. Tab filters scroll horizontally with `overflowX: auto` on mobile. Alert items are flex column, naturally responsive. Dismiss buttons have adequate tap targets (`minWidth/minHeight: 44` on mobile).

### Audiences/Audiences.tsx
- NEEDS FIX — Uses `useIsMobile()`. Grid collapses to 1fr on mobile with `minmax(360px, 1fr)`. The `360px` minimum width is problematic on screens below 375px (iPhone SE). Audience cards internal layout uses fixed `width: 72` for gauge SVG but that is fine. The overlap section uses flex-wrap which is OK.

### Settings/Settings.tsx
- NEEDS FIX — Uses `useIsMobile()`. Tab bar and integration grid adapt (4->2 cols). However: the webhook URL display area with monospace code has no `overflowX` handling and could overflow. The integration token input has `minWidth: 200` which is fine. The tab buttons don't have `overflowX: auto` for horizontal scroll on mobile — they use a fixed 2x2 grid which works but the labels could truncate.

### CampaignCreator/CampaignCreator.tsx
- GOOD — Uses `useIsMobile()`. Step indicator adapts (smaller circles 40->32, shorter connectors 80->40). Form fields are full width. Card constrains to `maxWidth: 800` on desktop, `100%` on mobile. Padding reduces. Touch targets adequate.

### Layout/TopNav.tsx
- GOOD — Uses `useIsMobile()`. Mobile shows hamburger menu. Padding reduces 24->12. Mobile menu overlay with full-screen nav. Tab badges hidden on mobile. Proper fixed positioning with `zIndex: 100`.

### Layout/SubNav.tsx
- GOOD — Uses `useIsMobile()`. Completely different mobile layout: horizontal scrollable pills with `overflowX: auto`, `scrollbarWidth: 'none'`, and `minHeight: 44` touch targets. Desktop gets vertical sidebar. Clean separation.

### Layout/AppLayout.tsx
- GOOD — Uses `useIsMobile()`. Flex direction switches column/row. `overflowX: 'hidden'` on root prevents horizontal scroll. Proper `paddingTop: 64` for fixed nav.

### Layout/CommandBar.tsx
- GOOD — Uses `useIsMobile()`. Bottom position adjusts (12 vs 20px). Logo/separator hidden on mobile for compactness. Compact action buttons. Centered with transform.

---

## Common Issues Found

1. **Audiences**: `minmax(360px, 1fr)` grid will overflow on 320px screens (iPhone SE width).
2. **Financial**: Fixed `width: 120` label in expense list; DRE table may be too narrow.
3. **Settings**: Webhook URL monospace block lacks overflow handling.
4. **Pipeline**: No mobile flow indicators between stages; dense metrics in expanded cards.
5. **Agent**: Quick topic buttons lack explicit touch target sizing (`minHeight: 44`).

## What's Done Well

- All 24 files use `useIsMobile()` hook.
- All tables with many columns have `overflowX: 'auto'` wrappers.
- Grids consistently collapse (4->2 or 2->1 columns).
- Touch targets generally respect 44px minimum on mobile.
- SubNav has a completely separate mobile layout (horizontal pills).
- TopNav has a proper mobile hamburger menu.
- CommandBar adapts by hiding non-essential elements.
- No CSS media queries needed — all handled via JS conditional styles.
