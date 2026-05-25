# Session Handoff

## Last Updated

May 25, 2026

## Current Source Of Truth

- Live implementation path: `index.html` + `js/app.js`
- Parked path: `js/runtime.js`
- If current behavior and older handoff notes conflict, trust the live legacy shell and the latest project docs

## Current Live Product Shape

- Tabs: `Overview`, `Pivot`, `Incidents Overview`, `Rejections`, `Guide`
- Incident charts, the incident register, and graph-data tables now live in the same `Incidents Overview` workspace
- Rejection filters stay in the `Rejections` tab rather than the main sidebar
- Export opens a modal and is profile/preset driven
- Bundled export defaults include `Base Profile` and `Base Preset`
- Guide/workbook docs describe the WU workbook contract first, with sample autoload treated as optional

## Verified In This Pass

- Localhost smoke check returned HTTP `200` for `http://127.0.0.1:8000/index.html`
- Bundled sample workbook contains:
  - `DATA`
  - `RejectionData`
  - `APN_VOLUME`
  - `SUGGESTIONS`
  - `REROUTE`
  - `CONFIG`
- The sample workbook confirms the live rejection alias case and support-sheet coverage used by the current docs

## Important Live Behaviors

### Filtering

- Incident filters live in the left sidebar
- Rejection filters are rendered from `js/rejection-filter-bar.js`
- Rejection accordion selections sync back into the underlying select-based filter state in `js/filters.js`

### Incident Workspace

- `Charts` mode renders the incident chart suite
- `Tables` mode renders the incident register plus incident/rejection graph-data tables
- The old `analytics` / `incidents` routes should resolve into `incidents-overview`

### Export

- Export modal checkboxes are generated from live export components
- Profile selection can apply bundled or configured defaults
- Preset selection can apply bundled defaults or user-saved checkbox sets
- PPT export remains native-first with fallback capture behavior when needed

### Workbook Contract

- Parser behavior lives in `js/data.js`
- Guide/spec documentation should match parser behavior even when workbook naming is imperfect
- Month normalization preserves year where present, for example `Jan-26 -> Jan 2026`

## Recommended Next Checks

- Open the dashboard in a real browser and visually verify:
  - merged Incidents Overview tab behavior
  - collapsible section persistence
  - Guide content layout
  - sidebar filter styling
  - rejection filter styling
  - export modal defaults and readability
- If business owners provide a stricter WU workbook schema, update docs and parser expectations together

## Key Files

- `index.html`
- `js/app.js`
- `js/data.js`
- `js/filters.js`
- `js/rejection-filter-bar.js`
- `docs/task/plan.md`
