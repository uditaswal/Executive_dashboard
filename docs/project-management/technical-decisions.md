# Technical Decisions

## Why Tabulator?

- Needed virtualization for 100k+ rows
- GitHub Pages compatible
- Faster than custom grid

## Why Config Files With `schema` And `version`?

- `schema` tracks config structure compatibility
- `version` tracks app/release version
- Lets config evolution happen independently from app releases

## Why `datasets = { incidents, rejections }`?

- Gives widgets, exports, summaries, and pivot logic one shared data abstraction
- Reduces coupling to legacy `APP.DATA` / `APP.filteredRejections` paths
- Makes future widget creation much simpler

## Why Hybrid Migration?

- Avoids a risky big-bang rewrite
- Preserves working workbook parsing and existing legacy views while the runtime grows
- Allows section-by-section replacement instead of rewriting everything at once

## Why Was The Runtime Shell Parked?

- The first runtime takeover overrode `APP.render` / `APP.parse` too aggressively
- It broke the active graph path and made the page structure confusing
- Restoring one live render path was safer than debugging two competing shells at once
- The runtime foundation is still useful, but it should return incrementally instead of replacing the live UI in one step

## Why `renderWidget(widgetConfig)` As A Rule?

- Prevents new bespoke render paths
- Keeps rendering centralized and testable
- Makes export, layout, visibility, and fallback handling consistent

## Why Widget Metadata Early?

- `dataVersion` helps detect dataset/schema drift
- `visible` supports hiding/export-only/disabled widgets
- `createdBy` supports protecting system defaults vs user-created widgets
- `cacheKey` standardizes aggregate reuse and avoids duplicated cache naming
- `layout` metadata avoids painful retrofitting later

## Why Safe Reset?

- LocalStorage-backed runtime state can become stale or corrupted

## Why keep hidden `<select multiple>` for rejection filters?

- Existing `APP.apply()` / `APP.matchesFilter()` logic already keys off those element IDs.
- The accordion UI syncs checkbox state to the selects so filtering stays consistent without rewriting the incident/rejection split in `filters.js`.
- Keeps the static GitHub Pages deployment simple (no build step).

## Why extend the existing collapsible behavior instead of adding `js/collapsible.js`?

- `js/app.js` already owned live section enhancement and render timing.
- Extending that path avoided duplicate DOM wrappers and competing click handlers.
- LocalStorage persistence could be added without changing the live module boundary.

## Why keep compatibility for `analytics` / `incidents` tab ids?

- Older hash links, export helpers, and WIP config paths still referenced those legacy ids.
- Mapping both to `incidents-overview` let the visible UI simplify without breaking those callers in one risky pass.

## Why `APP.onRejectionFilterChange` / `APP.getRejectionFilterState()`?

- Gives embedders a single hook when rejection-only filters change, without parsing the DOM or patching `APP.apply()`.
- Returns a plain object aligned with the pivot/export direction (`month`, `partner`, `deliveryService`, `bankName`, `bankCode`, `country`, `status`).

## Why map profile `widgetIds` to legacy export checkbox keys?

- Live charts still use legacy canvas ids (`c1`, `rc1`, …) while `configs/export-profiles.json` uses config widget ids (`incidents-monthly-trend`, …).
- `APP.PROFILE_WIDGET_EXPORT_KEYS` bridges the two so built-in profiles pre-check the right overview sections and canvases without a big-bang chart id migration.
