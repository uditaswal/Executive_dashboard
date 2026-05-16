# Executive Incident Dashboard

Browser-based dashboard for payment incidents and rejection data. The live app runs on the legacy `index.html` + `js/app.js` path; `js/runtime.js` remains parked work and is not the production shell.

## Current App Behavior

- Tabs: `Overview`, `Pivot`, `Analytics`, `Incidents`, `Rejections`, `Guide`
- The old standalone `Tables` tab has been merged into `Analytics`
- The left filter panel can be collapsed and reopened
- Analytics table mode and pivot table output now share Bottom N, sort, label filter, and exclude controls
- Pivot saves are deduplicated by chart definition, so saving the same pivot twice is blocked
- The `Rejections` tab includes a visible rejection register with column selection and paging
- Dashboard config and export profiles can be downloaded, imported, and reset from `Settings`
- Normalized workbook data can be downloaded from `Settings`
- PowerPoint export prefers native text, table, and supported chart output, with image fallback when needed

## How To Run

Use a local web server if you want linked CSS and sample workbook autoload to work:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

Direct `file://` usage is still supported for manual workbook upload, but these limitations are expected:

- sample workbook autoload is skipped
- any dev server URL such as `http://127.0.0.1:5500/...` will fail if that server is not running
- browser security rules may block local fetch-based workflows

## Workbook Notes

- Default sample workbook: `data/payments_incident_sample.xlsx`
- Main incidents sheet: `DATA` when present, otherwise first sheet
- Rejection sheet aliases accepted: `REJECTIONDATA`, `RejectionData`, `PAYOUT_DATA`, `PayoutData`
- `CONFIG`, `SUGGESTIONS`, `REROUTE`, and `APN_VOLUME` are optional
- Month normalization preserves year when it exists in source values, for example `Jan 2026`

## Main Workflows

### Filters

- Incident filters live in the left sidebar
- Rejection-specific filters live inside the `Rejections` tab
- Record counts, charts, KPIs, tables, and pivot output all refresh from the same filtered state

### Analytics

- `Charts` view shows the canvas-based chart suite
- `Tables` view shows the matching graph-data tables inside the same tab
- Top-N controls still apply to chart-heavy analytics and rejection views
- Table-mode cards include Top/Bottom N, label filtering, sort, and exclusion controls after aggregation

### Pivot Builder

- Build ad hoc charts and tables from the current filtered dataset
- Choose incident or rejection dataset
- Save useful pivots into dashboard config
- Duplicate pivot definitions are detected and rejected before save
- Pivot table output uses the same shared table-control model as Analytics table mode

### Rejections

- Rejection-specific filters remain inside the `Rejections` tab
- The visible rejection register uses the filtered rejection dataset as its source of truth
- Selected rejection columns affect both the visible register and exports

### Settings

- Download dashboard config JSON
- Import dashboard config JSON
- Reset dashboard config to bundled defaults
- Download export profiles JSON
- Import export profiles JSON
- Reset export profiles to bundled defaults
- Download normalized workbook data as `.xlsx`

## Important Files

- [index.html](index.html)
- [js/app.js](js/app.js)
- [js/data.js](js/data.js)
- [js/filters.js](js/filters.js)
- [js/charts.js](js/charts.js)
- [services/config-service.js](services/config-service.js)
- [docs/task/plan.md](docs/task/plan.md)

## Known Direction

- Keep the legacy dashboard stable first
- Reuse runtime/service helpers only when they can be safely isolated
- Treat `js/runtime.js` as parked WIP until a controlled migration is explicitly resumed
