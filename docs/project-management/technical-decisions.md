# Decisions

## Why Tabulator?

- Needed virtualization for 100k+ rows
- GitHub Pages compatible
- Faster than custom grid

## Why Config Files With `schema` And `version`?

- `schema` tracks config structure compatibility
- `version` tracks app/release version
- lets config evolution happen independently from app releases

## Why `datasets = { incidents, rejections }`?

- gives widgets, exports, summaries, and pivot logic one shared data abstraction
- reduces coupling to legacy `APP.DATA` / `APP.filteredRejections` paths
- makes future widget creation much simpler

## Why Hybrid Migration?

- avoids a risky big-bang rewrite
- preserves working workbook parsing and existing legacy views while the runtime grows
- allows section-by-section replacement instead of rewriting everything at once

## Why Was The Runtime Shell Parked?

- the first runtime takeover overrode `APP.render` / `APP.parse` too aggressively
- it broke the active graph path and made the page structure confusing
- restoring one live render path was safer than debugging two competing shells at once
- the runtime foundation is still useful, but it should return incrementally instead of replacing the live UI in one step

## Why `renderWidget(widgetConfig)` As A Rule?

- prevents new bespoke render paths
- keeps rendering centralized and testable
- makes export, layout, visibility, and fallback handling consistent

## Why Widget Metadata Early?

- `dataVersion` helps detect dataset/schema drift
- `visible` supports hiding/export-only/disabled widgets
- `createdBy` supports protecting system defaults vs user-created widgets
- `cacheKey` standardizes aggregate reuse and avoids duplicated cache naming
- `layout` metadata avoids painful retrofitting later

## Why Safe Reset?

- localStorage-backed runtime state can become stale or corrupted
- reset-to-default provides a fast recovery path without manual debugging

## Why Debounced Runtime Filters?

- avoids repeated rerenders and recalculations during typing
- especially important for large rejection datasets and future summary/export hooks

## Why No React?

- Static deployment
- Lower complexity
- Easier maintenance
