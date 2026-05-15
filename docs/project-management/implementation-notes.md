# AI Handoff

## Completed Work

- Added config files for dashboard widgets and export profiles.
- Added service modules for:
  - config loading/persistence
  - cache management
  - pivot helpers
  - export helpers
  - widget registry
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
  - rejection aliases are `RejectionData` and `PayoutData`
- Restored the legacy dashboard as the active page path after the runtime takeover broke graphs and structure.
- Removed runtime shell/script loading from `index.html`, so the parked runtime code no longer overrides live rendering.

## Pending Work

- Keep the live legacy dashboard stable and browser-test all charts against the sample workbook.
- Finish the current Rejections section safely in the legacy path:
  - bank name filter
  - bank code filter
  - status filter
  - any missing rejection charts/tables
- Decide later whether to resume runtime migration behind an isolated flag/path.
- Centralize export only after the active render path is stable.
- Move pivot builder into the runtime/service layer only during a controlled migration.
- Add config/profile import-export UI.
- Add browser-tested confirmation for the live legacy dashboard:
  - charts
  - tables
  - rejection rendering
  - export flows

## Current Focus

- Legacy dashboard remains the live path; rejection filters now use the accordion UI described in `docs/task/plan.md` Phase 1 (hidden selects + `js/rejection-filter-bar.js`).

## Risks / Watchouts

- Parked runtime code still exists in the repo and may be tempting to reactivate too quickly.
- If runtime work resumes, avoid global overrides of `APP.render` and `APP.parse` until parity is proven.
- The safest next improvements are in the active legacy path, not another broad architectural switch.

## Recommended Next Step

- Browser-test the restored legacy dashboard with `payments_incident_sample.xlsx`, then finish any missing Rejections features inside that live path before attempting another runtime rollout.

## Critical Architecture Rules

- Never bypass `renderWidget(widgetConfig)` for new runtime work.
- Do not add new hardcoded widget-specific render functions outside the widget registry.
- Reusable heavy aggregations must go through the cache layer.
