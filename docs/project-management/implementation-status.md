# Implementation Status

## Completed Work

- Added config files for dashboard widgets and export profiles.
- Added service modules for:
  - Config loading/persistence
  - Cache management
  - Pivot helpers
  - Export helpers
  - Widget registry
- Added `APP.datasets` to the shared app state.
- Added `js/runtime.js` as the new config-driven bootstrap/runtime layer.
- Implemented `renderWidget(widgetConfig)` as the new rendering entrypoint for runtime widgets.
- Added widget fallback rendering so a single broken widget does not crash the dashboard.
- Added runtime safe reset via `btnResetDashboard`.
- Added `schema`, `version`, `dataVersion`, `visible`, `createdBy`, and `cacheKey` usage in the initial config layer.
- Added debounced runtime filters.
- Added first-pass runtime chart/table/kpi/summary renderers as parked groundwork.
- Confirmed the real workbook shape:
  - `APN_VOLUME` contains reroute-style fields
  - `REROUTE` contains monthly count fields
  - Rejection aliases are `RejectionData` and `PayoutData`
- Restored the legacy dashboard as the active page path after the runtime takeover broke graphs and structure.
- Removed runtime shell/script loading from `index.html`, so the parked runtime code no longer overrides live rendering.
- Rejection tab filters: accordion multi-select UI with per-filter Clear, Reset all, rotating chevron headers with "N selected" / "All" summary, and `APP.onRejectionFilterChange` / `APP.getRejectionFilterState()` for integrations. Hidden `<select multiple>` elements remain the source of truth for `APP.apply()`.

## Pending Work

- Keep the live legacy dashboard stable and browser-test all charts against the sample workbook.
- Finish the current Rejections section safely in the legacy path:
  - Any missing rejection charts/tables beyond current filters and KPIs
- Decide later whether to resume runtime migration behind an isolated flag/path.
- Centralize export only after the active render path is stable.
- Move pivot builder into the runtime/service layer only during a controlled migration.
- Add config/profile import-export UI.
- Add browser-tested confirmation for the live legacy dashboard:
  - Charts
  - Tables
  - Rejection rendering
  - Export flows
- Integrate Tabulator for 100k+ row virtualization (Phase 1 pending in `docs/task/plan.md`).