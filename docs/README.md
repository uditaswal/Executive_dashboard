# Executive Incident Dashboard

A browser-based executive dashboard for reviewing payment incidents, partner impact, SLA breaches, reroutes, APN volume, RCA summaries, and filtered incident details from an Excel workbook.

The app is built with plain HTML, CSS, and JavaScript. It uses SheetJS to read Excel and CSV files, Chart.js to render charts, `html2canvas` for PNG capture, and `PptxGenJS` for PowerPoint export.

## Current Project Status

- Primary sample workbook: `data/payments_incident_sample.xlsx`
- Sample workbook last updated in this repo: `2026-05-06`
- Optional config workbook also present: `data/config.xlsx`
- The dashboard title defaults to `Payments Dashboard`

## Features

- Auto-loads `data/payments_incident_sample.xlsx` when served from a local web server.
- Supports manual upload of `.xlsx`, `.xls`, and `.csv` files.
- Normalizes sheet names and column names before matching, so casing, spaces, punctuation, and minor naming variations are handled more safely.
- Applies live multi-select filters for month, partner, status, priority, region, receive country, issue owner, category, impact type, and free-text incident search.
- Includes four main views: `Overview`, `Analytics`, `Tables`, and `Incidents`.
- Shows KPI cards, executive summary text, priority breakdown, resolution and impact breakdowns, overview insights, period metrics, WU platform RCA, and vendor issues.
- Renders 22 analytics charts and matching graph-data tables from the current filtered dataset.
- Includes a pivot-style builder that can generate charts and tables on the fly from the uploaded Excel data.
- Lets users choose which Excel columns appear in the incident register.
- Exports selected overview sections, charts, and tables to PNG, PowerPoint, and Excel.
- Reads optional multi-sheet data for configuration, suggestions, reroute metrics, and APN volume trends.

## Project Structure

```text
.
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   |-- app.js
|   |-- charts.js
|   |-- data.js
|   |-- filters.js
|   `-- views.js
|-- data/
|   |-- config.xlsx
|   |-- payments_incident_sample.xlsx
|   `-- Sample_PPT.pptx
`-- docs/
    |-- README.md
    |-- EXCEL_SPECIFICATION.md
    `-- adding_new_charts.md
```

## How To Run

Because the dashboard fetches the local workbook, use a local web server for auto-load.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

You can also open `index.html` directly and upload a workbook manually, but `Auto Load` depends on browser access to local files and is most reliable through a local server.

## Default Workbook

The default workbook path is:

```text
data/payments_incident_sample.xlsx
```

Workbook loading behavior:

- The app uses the `DATA` sheet when present.
- If `DATA` is missing, it falls back to the first workbook sheet.
- `CONFIG` and `Config` are both accepted for dashboard settings.
- `REROUTE` and `APN_VOLUME` can be discovered by required columns even if the sheet name differs.
- Sheet matching is normalized before lookup, so variants like extra spaces, underscore differences, or casing differences are tolerated.

## Normalization Rules

Before matching sheets or columns, the app normalizes names by:

- trimming whitespace
- removing Excel `_x000d_` artifacts
- lowercasing
- removing spaces and punctuation for comparison

Examples that can now resolve to the same logical field include:

- `CONFIG`, `Config`, `config`
- `Issue Category`, `issue category`, `Issue-Category`
- `Issue(WU/Partner)` and spaced or punctuated variants
- `Receive Country` and minor formatting variations

## Supported Workbook Sheets

| Sheet                | Required | Purpose                                                                                |
| -------------------- | -------- | -------------------------------------------------------------------------------------- |
| `DATA`               | Yes      | Main incident records used by filters, charts, KPIs, tables, and the incident register |
| `CONFIG` or `Config` | No       | Dashboard title and theme color                                                        |
| `SUGGESTIONS`        | No       | Overview recommendation list                                                           |
| `REROUTE`            | No       | Rerouted transaction count and saved USD metrics                                       |
| `APN_VOLUME`         | No       | APN monthly transaction volume trend                                                   |

If a `DATA` sheet is not available, the dashboard uses the first sheet in the workbook as the main dataset.

## Main Filters

The sidebar currently filters by:

- `Month`
- `Partner`
- `Status`
- `PRIORITY`
- `Region`
- `Receive Country`
- `Issue Owner`
- `Category`
- `Impact type`
- Keyword search across each full row

`Issue Owner` is normalized from `Issue(WU/Partner)` or `Issue (WU issue/Partner side)` into values such as `WU side` and `Partner side`.

## Overview View

The `Overview` tab includes:

- Executive summary
- KPI cards
- Priority breakdown cards
- Resolution and impact breakdown panels
- An overview builder with four subtabs:
  - `Insights`
  - `<Period> View`
  - `WU Issues`
  - `Vendor Issues`
- Suggestions

The period label is dynamic. Depending on the current month filter, it can show values like `Jan`, `Jan-Mar`, `Q1`, or a comma-separated month list.

## Analytics View

The `Analytics` tab currently renders these charts:

1. `Monthly Incident Trend`
2. `Incident Status Split`
3. `Priority Distribution`
4. `Top Partner Incident Ranking`
5. `Top Receive Countries`
6. `Delayed vs Breached Trend`
7. `Transaction Loss by Partner`
8. `APN Monthly Transaction Volume`
9. `WU vs Partner Side Issues`
10. `WU vs Partner Side Trend`
11. `Partner Side Issue Category Trend`
12. `Top Impacted Wallet Trend`
13. `Top Partners by Delayed MTCNs`
14. `Top Wallets by Delayed MTCNs`
15. `Resolution Time Split`
16. `Impact Type Split`
17. `Issue Category by Month`
18. `Monitoring Gap / Detection Delay`
19. `Rejected Transactions by Partner`
20. `Operational Impact by Month`
21. `Receive Country Impact`
22. `Insufficient Funds by Partner`

Users can also toggle `Show counts on charts`.

## Tables View

The `Tables` tab now includes two capabilities:

- A pivot-style builder for ad hoc chart and table generation from the currently filtered workbook data
- The built-in graph-data tables that mirror the analytics charts

The built-in graph-data tables include:

- Monthly trend
- Status split
- Priority distribution
- Partner and country rankings
- Receive country impact
- Delayed versus breached monthly totals
- Transaction loss by partner
- APN monthly transaction volume
- WU versus partner ownership
- Partner-side category trends
- Wallet trends
- Delayed, rejected, and operational impact tables
- Resolution, impact, and monitoring splits
- Insufficient funds trend

### Pivot Builder

The pivot builder works on the currently filtered `DATA` rows and lets users choose:

- `Rows`
- `Columns`
- `Values`
- `Aggregation` as `Count` or `Sum`
- `Chart Type` as `Bar`, `Line`, `Doughnut`, or `Pie`

It generates:

- a chart from the selected pivot setup
- a matching table showing the same grouped output

This is intended to feel similar to a lightweight Excel pivot chart workflow inside the dashboard.

## Incidents View

The `Incidents` tab includes:

- Live counts for shown incidents, open incidents, and major incidents
- A column picker sourced from the uploaded Excel headers
- `Default`, `All`, and `Clear` column actions
- A filtered incident register capped to the first 500 rows in the UI

Default incident columns include:

```text
Incident
Month
Partner
Receive Country
Issue (WU issue/Partner side)
issue category
Status
PRIORITY
Impact type
Time Taken for Resolution
Delayed Transaction
Delivery Breached
```

## Exports

The current export modal supports:

- PNG export of selected overview sections, charts, and graph tables
- PowerPoint export of selected overview sections, charts, and graph tables
- Excel export of selected overview sections, charts, and graph tables

Excel export writes separate sheets for each selected chart or table and names the file using the current review period, for example:

```text
dashboard-export-q1.xlsx
```

## Notes About Current Summary Text

The executive summary in the UI mixes live metrics with fixed 2026 narrative lines. At the time of this update, these statements are still hard-coded in `js/app.js` rather than calculated from workbook data:

- APN transaction volume averaging 7 million per month in 2026 with 75% real time
- Retail versus digital processing mix of 55% and 45%
- Overall rejection rate stable at about 1.38% of volume

If those figures change, update the summary logic in `js/app.js` in addition to refreshing workbook data.

## Main Files

- `index.html` defines the dashboard layout, filter controls, tabs, export modal, overview builder, chart canvases, and incident register.
- `js/data.js` loads workbook sheets, cleans Excel text, applies config, and initializes app state.
- `js/filters.js` populates filter dropdowns and applies the active filters.
- `js/charts.js` defines chart helpers, graph-data tables, export order, and all analytics charts.
- `js/app.js` renders summary content, KPIs, overview tables, suggestions, incident columns, and export flows.
- `js/views.js` handles main tab switching.
- `css/style.css` contains all dashboard styling.

## Adding New Charts

See `docs/adding_new_charts.md` for the current chart and table workflow.
