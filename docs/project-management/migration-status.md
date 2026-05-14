# Current Refactor State

## Completed

- Added config/runtime foundation:
  - `configs/default-dashboard.json`
  - `configs/export-profiles.json`
  - `schema` and `version` fields
- Added service layer:
  - `services/config-service.js`
  - `services/cache-service.js`
  - `services/pivot-engine.js`
  - `services/export-service.js`
  - `services/widget-registry.js`
- Added `APP.datasets = { incidents, rejections }` in `js/data.js`.
- Added new runtime entrypoint in `js/runtime.js`.
- Added config-driven widget rendering via `renderWidget(widgetConfig)`.
- Added widget safety/fallback behavior so one broken widget does not crash the dashboard.
- Added runtime-safe reset to reload repo defaults and clear local config/profile overrides.
- Added data-version validation for widgets via `widget.dataVersion`.
- Added debounced runtime filters for the new shell.
- Added cache-key-based aggregate reuse for runtime chart widgets.
- Confirmed workbook structure for the active sample files:
  - `DATA`
  - `APN_VOLUME` contains `TXN_COUNT`, `SENDAMOUNTINUSD`, etc.
  - `REROUTE` contains `CREATED_DATE`, `COUNT(*)`
  - rejection sheets are `RejectionData` / `PayoutData`
- Restored the legacy dashboard as the active live UI after the runtime takeover broke graph rendering and page structure.
- Kept the runtime/config/service code in the repo as parked groundwork, but it is not loaded by `index.html`.

## In Progress

- Legacy dashboard stabilization with improved data loading and rejection support.
- Runtime/config architecture remains available as non-live groundwork for a later, safer reintroduction.

## Pending

- Decide whether to reintroduce the runtime architecture incrementally behind feature flags or keep extending the legacy dashboard first.
- Migrate all remaining sections from legacy rendering into config-driven widgets:
  - Overview
  - Incidents
  - Vendor RCA
  - Executive Summary
- Expand the current legacy Rejections experience safely if needed:
  - bank name filter
  - bank code filter
  - status filter
  - country filter
  - delivery service parity checks
- Added new filters for Bank Name, Bank Code, and Status to the rejection tab.
- Updated `APP.filteredRejections` logic in `filters.js` to include these filters.
- Centralize export more cleanly if the runtime path is revived later.
- Move pivot builder to a service/runtime ownership model only after the live legacy path is stable.
- Add config import/export UI for dashboard config and profiles.
- Add profile editing/saving UX in runtime.
- Add smarter rerendering using `dependsOn`.
- Add stronger schema migration handling for future config changes.

## Important Rules

- All new widgets MUST use `renderWidget(widgetConfig)`.
- No new hardcoded widget-specific renderers should be added outside the registry path.
- Rejection-heavy widgets must use the cache layer for reusable aggregates.
- Runtime-created widgets should use UUIDs from `ConfigService.createWidgetId()`.
- Config compatibility is controlled by `schema`; app release tracking is controlled by `version`.

## Known Issues

- The runtime/config code exists in the repo but is intentionally not loaded by `index.html` right now.
- `js/runtime.js` and the `services/` modules should be treated as parked WIP, not production-active code.
- If runtime work resumes, it should return in smaller slices instead of taking over `APP.render` / `APP.parse` globally.
