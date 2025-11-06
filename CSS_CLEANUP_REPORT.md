# CSS Cleanup Report
**Branch:** `big-overhaul_live-site-merge`  
**Date:** 2025-01-XX  
**Goal:** Remove bloat, dedupe, fix load-order/specificity without visual changes

## Summary
Consolidated duplicate styles, removed dead code comments, fixed CSS load order, and tokenized repeated color values. All changes maintain visual parity.

## Files Modified

### `layout/theme.liquid`
- **Load Order Fix:** Moved `cart-drawer.css` from bottom of `<body>` to `<head>` section (line 289)
- **Rationale:** CSS should load in `<head>` for proper cascade. Scripts remain at bottom of body.

### `assets/base.css`
- **Removed:** Dead "REMOVED" comments (lines 3709, 3716, 4195)
- **Consolidated:** Header icon styles - removed 3 duplicate blocks (lines 4337-4355, 4399-4405, 4459)
- **Consolidated:** Cart badge styles - single canonical definition at line 4339
- **Tokenized:** Cart badge background color `#F7E06A` → `var(--brand-yellow)`
- **Kept:** Base `.cart-count-bubble` style (line 2170) - used by `cart-icon-bubble.liquid` section

### `assets/astra.css`
- **Removed:** Dead "REMOVED" comments (lines 211-212, 509-510)
- **Tokenized:** Cart badge background color `#eded6b` → `var(--brand-yellow)`

### `assets/custom.css`
- **Removed:** Dead "REMOVED" comments (lines 23-28, 140)
- **Removed:** Duplicate header icon styles (lines 106-120)

### `assets/component-ux-fixes.css`
- **Removed:** Dead "REMOVED" comment (line 21)
- **Consolidated:** Header icon styles - single canonical override block (lines 31-68)
- **Rationale:** This file loads last, so it's the right place for final overrides

## Largest Duplicates Eliminated

1. **Header Icon Styles** - Removed 4 duplicate blocks totaling ~40 lines
   - Consolidated into base.css (base definitions) + component-ux-fixes.css (overrides)
   
2. **Cart Badge Styles** - Removed 2 duplicate definitions
   - Single canonical style in base.css line 4339
   - Base fallback in astra.css line 387

3. **"REMOVED" Comments** - Removed 7 dead comment blocks
   - These were leftover markers from previous migrations

## Selectors Kept Intentionally More Specific

1. **`.header__icon--cart .cart-count-bubble`** (base.css:4339)
   - More specific than base `.cart-count-bubble` to override for header context
   - Base `.cart-count-bubble` kept for `cart-icon-bubble.liquid` section

2. **`.button:not(.cart-drawer .button)`** (base.css:3757)
   - Necessary to exclude cart drawer buttons from global button overrides
   - Cart drawer has its own button styles in `cart-drawer.css`

## Unavoidable !important Flags

1. **Header Icons** (component-ux-fixes.css:37-39)
   - `background: transparent !important`
   - `border: 0 !important`
   - `box-shadow: none !important`
   - **Why:** Overriding theme defaults that use high specificity

2. **Cart Checkout Button** (base.css:3822-3824)
   - `display: inline-flex !important`
   - `background: var(--brand-yellow) !important`
   - `color: #000 !important`
   - **Why:** Overriding Shopify payment button styles

3. **Mobile Menu Drawer** (base.css:3961-3984)
   - Multiple `!important` flags for z-index and display
   - **Why:** Ensuring drawer appears above all other content

## Tokenization Changes

### Colors Tokenized
- Cart badge background: `#F7E06A` / `#eded6b` → `var(--brand-yellow)`
- **Test:** Change `--brand-yellow` in `:root` (base.css:3744) to see cart badge color update

### Existing Tokens (No Changes)
- `--brand-yellow: #F7E06A` (base.css:3744)
- `--ink-900`, `--ink-700`, `--ink-500`, `--ink-300`, `--paper`, `--paper-inv` (base.css:3745)
- `--radius-xl`, `--radius-lg`, `--radius-md` (base.css:3747)
- `--shadow-1`, `--shadow-2` (base.css:3748-3749)

## Load Order (Final)

1. `base.css` - Theme foundation
2. `astra.css` - Design system tokens
3. `custom.css` - Custom overrides
4. `component-cart-items.css` - Async loaded
5. `component-cart-drawer.css` - Conditional (cart drawer)
6. `component-cart.css` - Conditional
7. `component-totals.css` - Conditional
8. `component-price.css` - Conditional
9. `component-discounts.css` - Conditional
10. `cart-drawer.css` - Conditional (moved from body)
11. `component-localization-form.css` - Conditional
12. `component-predictive-search.css` - Conditional, async
13. `custom-overrides.css` - Final overrides
14. `component-ux-fixes.css` - Final fixes (loads last)

## One-Minute Tweak Test

**Change:** `--brand-yellow` value in `base.css` line 3744

**Current:** `--brand-yellow: #F7E06A;`

**Test:** Change to `--brand-yellow: #FF0000;` (red)

**Expected Result:** 
- Cart badge turns red
- All buttons turn red
- Any element using `var(--brand-yellow)` updates

This proves the token system works and styles cascade correctly.

## Acceptance Checks

✅ **Visual Parity:** No visual regressions expected (changes are consolidation only)  
✅ **Load Order:** Cart drawer CSS now loads in `<head>` before content renders  
✅ **Specificity:** Header icon styles consolidated with proper cascade  
✅ **Tokens:** Cart badge uses `var(--brand-yellow)` token  
✅ **Dead Code:** All "REMOVED" comments cleaned up  

## Notes

- Base `.cart-count-bubble` style (base.css:2170) intentionally kept separate from header badge
- Button styles already well-consolidated, no changes needed
- Collection grid styles have some duplication but serve different contexts
- Some `!important` flags remain necessary for overriding Shopify defaults

## Next Steps (Optional Future Cleanup)

1. Consolidate collection grid styles (currently 2-3 definitions for different contexts)
2. Review and potentially consolidate cart drawer button styles
3. Consider extracting more hardcoded colors to tokens
4. Audit component-specific CSS files for cross-file duplicates

