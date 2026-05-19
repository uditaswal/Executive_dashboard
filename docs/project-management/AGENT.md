# AGENT.md

## Project Snapshot

- App type: browser dashboard for incidents and rejections
- Live path: `index.html` + legacy JS modules
- Parked path: `js/runtime.js`

## Live Files

- `index.html`: shell, tabs, modals, filter sidebar
- `js/data.js`: workbook parsing, normalization, and optional sample autoload
- `js/filters.js`: incident and rejection filter application
- `js/charts.js`: chart creation for incident and rejection visuals
- `js/app.js`: legacy orchestration, tables, pivot builder, settings/export bindings
- `services/config-service.js`: config/profile persistence and JSON backup/import helpers

## Important Rules

- Do not re-enable `js/runtime.js` in the live HTML shell unless the migration is explicitly resumed.
- Prefer stabilizing the legacy path over moving behavior into runtime abstractions.
- When testing local loading:
  - `http://localhost/...` is useful for fetch-based sample workbook autoload
  - `file://` is still valid for manual workbook upload
  - workbook guidance should describe the WU sheet contract first, not the sample-data path first

## Current UX

- Tabs: `Overview`, `Incident`, `Rejections`, `Guide`
- `Incident` contains charts, graph-data tables, and incident pivots
- Sidebar can be collapsed
- Pivot saves are deduplicated
- Settings handles config/profile import-export and normalized workbook download
- Export modal includes a bundled `Base Profile` and `Base Preset`
