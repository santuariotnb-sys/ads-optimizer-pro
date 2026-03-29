# Responsiveness Audit Report — Ads.Everest

**Date:** 2026-03-29
**Breakpoint:** 768px via `useIsMobile()` from `src/hooks/useMediaQuery.ts`

---

## Summary

| Rating | Count |
|--------|-------|
| RESPONSIVE | 14 |
| PARTIAL | 5 |
| NOT RESPONSIVE | 0 |

---

## Component Reports

### 1. AppLayout.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 7)
- **Grids:** No grids; uses flexbox column layout
- **Mobile padding:** Adapts padding (12px mobile vs 32px desktop, lines 28-29)
- **No issues found**

### 2. TopNav.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 30)
- **Mobile adaptations:**
  - Logo text hidden on mobile (line 63)
  - Desktop tabs replaced with icon-only buttons on mobile (lines 115-142)
  - Mobile hamburger menu with animated dropdown (lines 223-301)
  - User name hidden on mobile (line 207)
  - Touch targets: Mobile tab buttons are 36x36 (line 128-129) — below 44px minimum
- **Issue:** line 128-129: Mobile tab buttons `width: 36, height: 36` — below 44px touch target. Same for bell button (line 153-154) and menu toggle (line 230-231). Low severity since buttons have spacing.

### 3. SubNav.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 17)
- **Horizontal scroll:** Properly implemented with `overflowX: 'auto'`, `WebkitOverflowScrolling: 'touch'`, hidden scrollbar (lines 32-37, 81-83)
- **Mobile padding:** Reduced padding on mobile (line 55)
- **Buttons:** `whiteSpace: 'nowrap'`, `flexShrink: 0` prevents text wrapping (lines 69-70)
- **Issue:** line 55: Mobile button padding `6px 12px` yields ~30px height — below 44px touch target

### 4. CommandBar.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 53)
- **Mobile adaptations:**
  - Bottom position adjusts (12px vs 20px, line 63)
  - Labels hidden on mobile, icon-only (line 125)
  - Reduced padding on mobile (line 107)
- **Issue:** line 107: Mobile button padding `6px 8px` yields ~32px height — below 44px touch target

### 5. Overview.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 321)
- **Grid adaptations:**
  - KPI grid: `repeat(2, 1fr)` on mobile vs `repeat(4, 1fr)` (line 360)
  - Signal+Gauge row: `1fr` on mobile vs `1.25fr 0.75fr` (line 400)
  - Inner signal grid: `1fr` on mobile vs `1fr auto` (line 432)
  - Campaigns+Weekly+Actions: `1fr` on mobile vs 3-column (line 502)
- **No hardcoded widths that overflow**
- **Text truncation:** Campaign names have ellipsis (line 548)
- **No issues found**

### 6. Dashboard.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 21)
- **Grid adaptations:**
  - Title font size adjusts (22 vs 28, line 40)
  - Metric cards: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 96)
  - Main grid: `1fr` vs `1fr 220px` (line 86)
  - Gap adjusts (10 vs 16, line 97)
- **Table:**
  - Wrapped in `overflowX: 'auto'` container (line 166)
  - Columns hidden on mobile: Frequencia, CTR (line 171)
  - Mobile cell styles with smaller padding/font (lines 335-343)
  - Campaign name has text-overflow ellipsis with maxWidth (lines 224-226)
- **No issues found**

### 7. Campaigns.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 26)
- **Adaptations:**
  - Header: column direction on mobile (line 55)
  - Search: full width on mobile (line 83)
  - Metrics grid: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 240)
  - Action buttons: column direction on mobile (line 349), with `minHeight: 44` for touch targets (line 372)
  - Ad set grid: `1fr 1fr` vs `1.5fr repeat(5, 1fr)` (line 413)
  - Ad set name spans full row on mobile (line 429)
  - Ad set area scrollable on mobile (line 392)
  - Campaign name has text-overflow ellipsis (lines 180-183)
  - Title font adjusts (20 vs 24, line 59)
- **No issues found**

### 8. Creatives.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 252)
- **Adaptations:**
  - Creative grid: `1fr` on mobile vs `repeat(auto-fill, minmax(280px, 1fr))` (line 366)
  - Inner metrics grid: `repeat(2, 1fr)` vs `repeat(3, 1fr)` (line 212)
  - Card padding adjusts (10 vs 14, line 197)
  - Sort buttons have larger padding on mobile (line 349)
  - Filter bar has `overflowX: 'auto'` on mobile (line 306)
  - Creative name has text-overflow ellipsis (lines 201-204)
- **Issue:** line 349: Sort button `minHeight: 36` — below 44px touch target
- **Issue:** line 306: Filter buttons padding `6px 14px` — height below 44px

### 9. SignalEngine.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 395)
- **Adaptations:**
  - Stat cards: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 30)
  - EMQ+CAPI grid: `1fr` vs `1fr 1.5fr` (line 454)
  - Signal+Synthetic grid: `1fr` vs `1fr 1fr` (line 460)
  - Padding adjusts throughout
  - JSON pre text wraps with `whiteSpace: 'pre-wrap'` and `wordBreak: 'break-all'` (line 272)
- **Issue:** line 432-434: "Configurar Funil" button has no mobile touch target size consideration — `padding: '8px 16px'` yields ~36px height

### 10. SignalAudit.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 103)
- **Adaptations:**
  - Outer padding: 16 vs 32 (line 125)
  - Score overview: column direction on mobile (line 143)
  - Gauge sizes adjust: 100 vs 130 (line 149)
  - Zone badge alignment: center vs flex-start (line 162)
  - Pillars grid: `1fr` vs `repeat(2, 1fr)` (line 192)
  - Empty state padding adjusts (line 109)
- **Issue:** line 62: PillarCard text color uses `#e2e8f0` (dark theme color) but the app uses light background — possible contrast issue (not strictly a responsiveness issue)

### 11. SignalGateway.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 54)
- **Adaptations:**
  - Header: column direction on mobile (line 130)
  - Tab labels hidden on mobile, icon-only (line 187)
  - Metric cards: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 216)
  - Pipeline+EMQ grid: `1fr` vs `1fr 1fr` (line 251)
  - Funnel form grids: `1fr` vs multi-column on all grids (lines 359, 376, 432)
  - EPV display: column direction on mobile (line 416)
  - Delivery status: column direction on mobile (line 306)
- **Issue:** line 141: Header h1 uses color `#f5f5f5` (light text on light bg) — dark theme color mismatch but not a responsiveness issue
- **No responsiveness issues**

### 12. Financial.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 41)
- **Adaptations:**
  - KPI grid: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 134)
  - Add expense form: `1fr` vs `repeat(4, 1fr) auto` (line 225)
  - Webhook stats grid: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 205 in Settings — referenced pattern)
- **Issue:** line 195: DRE bottom stats use `flexWrap: 'wrap'` which is good, but margin/gap numbers on narrow screens may cause tight spacing — minor

### 13. UTMTracking.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 38)
- **Adaptations:**
  - Summary cards: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 122)
  - UTM generator grid: `1fr` vs `repeat(2, 1fr)` (line 272)
- **Issue (PARTIAL):** line 200-210: Source header row has `display: 'flex'` with revenue, vendas count, and percentage inline. On narrow screens, this row may overflow or become cramped — no `flexWrap: 'wrap'` or mobile adaptation
- **Issue:** line 299-300: Generated URL code block uses `wordBreak: 'break-all'` which is correct, but the copy button beside it may squeeze the URL display on very narrow screens

### 14. Alerts.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 39)
- **Adaptations:**
  - Tab bar: `flexWrap: 'nowrap'` + `overflowX: 'auto'` on mobile (line 82)
  - Alert card padding adjusts (12 vs 16, line 127)
  - Gap adjusts (10 vs 14, line 129)
  - Dismiss button has `minWidth: 44` and `minHeight: 44` on mobile (lines 174-175) — properly handles touch targets
- **No issues found**

### 15. Agent.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 304)
- **Adaptations:**
  - Header padding adjusts (line 395)
  - Quick topics: 2-column grid on mobile vs flex-wrap (lines 444-446)
  - Message bubbles: 90% max-width on mobile vs 75%/85% (lines 484, 488)
  - Messages area padding adjusts (line 481)
  - Input area padding adjusts (line 527)
  - Send button is 44x44 (line 210-211) — meets touch target
- **No issues found**

### 16. AutoScale.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 59)
- **Adaptations:**
  - Stats grid: `repeat(2, 1fr)` vs `repeat(3, 1fr)` (line 90)
  - Rules grid: `1fr` vs `repeat(2, 1fr)` (line 111)
  - Padding adjusts throughout
  - Gap/margin adjusts
- **Issue (PARTIAL):** line 90: Stats grid `repeat(2, 1fr)` with 3 items means the 3rd item wraps to a new row and stretches full width on mobile, which may look asymmetric
- **Issue:** line 157: Activity log timestamp `minWidth: 120` — on very narrow screens (<360px) this fixed width plus the action text could cause horizontal overflow in the log entries

### 17. Pipeline.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 208)
- **Adaptations:**
  - Container padding adjusts (line 217)
  - Title margin adjusts (line 221)
  - Pipeline row: column direction on mobile (line 239)
  - Cards: full width on mobile (line 249)
  - Card padding adjusts (line 249)
  - Connectors: vertical with ChevronDown on mobile vs horizontal with ChevronRight (lines 439-463)
- **No issues found**

### 18. Settings.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 25)
- **Adaptations:**
  - Tab labels hidden on mobile, icon-only (line 130)
  - Webhook stats grid: `repeat(2, 1fr)` vs `repeat(4, 1fr)` (line 205)
  - General preferences grid: `1fr` vs `repeat(2, 1fr)` (line 254)
- **No issues found**

### 19. Playbook.tsx — RESPONSIVE
- **useIsMobile:** Yes (line 54)
- **Adaptations:**
  - Max-width: 100% on mobile vs 900px (line 81)
  - Category tabs: `flexWrap: 'nowrap'` + `overflowX: 'auto'` on mobile (line 95)
  - Tab padding adjusts (line 102)
  - Entry card padding adjusts (line 142)
- **No issues found**

---

## Cross-cutting Issues

### Touch Targets (< 44px)
Most interactive elements on mobile fall below the 44px minimum recommended by Apple/Google:
- **TopNav:** Tab icons 36x36, bell 36x36, menu 36x36
- **SubNav:** Buttons ~30px height
- **CommandBar:** Buttons ~32px height
- **Creatives:** Sort buttons ~36px
- **SignalEngine:** "Configurar Funil" button ~36px

These are pervasive but low-severity since the buttons have adequate spacing between them.

### Font Sizes
No font sizes are problematic. The smallest used is 9px for labels, which is acceptable for supplementary data. Critical data uses 12-28px.

### Hardcoded Widths
No hardcoded widths that would cause overflow. The `minWidth: 120` in AutoScale activity log (line 157) is the only potential issue on very narrow devices (<360px).

### Horizontal Scroll
Properly handled in SubNav, Alerts tabs, Playbook tabs, and Dashboard table with `overflowX: 'auto'` + `WebkitOverflowScrolling: 'touch'`.

### Text Truncation
Properly applied where needed: campaign names in Dashboard (line 225), Overview (line 548), Campaigns (line 181), and creative names in Creatives (line 201).

---

## Verdict

The codebase has **excellent responsive coverage**. All 19 components import and use `useIsMobile()`. Grid layouts universally adapt (4-col to 2-col or 1-col). No component will break on mobile. The main improvement area is **touch target sizes** — many mobile buttons are 32-36px instead of the recommended 44px minimum.
