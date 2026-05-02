# Executive Incident Dashboard

A browser-based executive dashboard for reviewing payments incidents, partner impact, SLA breaches, reroutes, transaction volume, and operational recommendations from an Excel workbook.

The app is built with plain HTML, CSS, and JavaScript. It uses SheetJS to read Excel/CSV files and Chart.js to render charts.

## Features

- Loads incident data from an Excel workbook.
- Supports local auto-load from `data/payments_incident_sample.xlsx`.
- Supports manual upload of `.xlsx`, `.xls`, and `.csv` files.
- Provides filters for month, partner, status, priority, region, and keyword search.
- Shows executive summary, KPI cards, metrics table, suggestions, analytics charts, and an incidents table.
- Reads optional multi-sheet data for reroute metrics, APN volume, configuration, and suggestions.

## Project Structure

```text
.
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   |-- data.js
|   |-- filters.js
|   |-- charts.js
|   |-- views.js
|   |-- app.js
|   `-- adding_new_charts.md
|-- data/
|   |-- payments_incident_sample.xlsx
|   |-- payments_incident_sample_old.xlsx
|   |-- payments_incident_samplev2.xlsx
|   `-- config.xlsx
|-- excel.md
`-- README.md
```

## How To Run

Because the dashboard fetches the local Excel file, use a local web server for auto-load.

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

You can also open `index.html` directly in a browser and upload a workbook manually, but the Auto Load button may not work without a local server.

## Data Workbook

The default workbook path is:

```text
data/payments_incident_sample.xlsx
```

Recommended workbook sheets:

| Sheet         | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| `DATA`        | Main incident records used for filters, KPIs, charts, summary, and table. |
| `CONFIG`      | Optional dashboard settings such as title and theme color.                |
| `SUGGESTIONS` | Business recommendations displayed in the overview.                       |
| `REROUTE`     | Rerouted transaction count and USD value metrics.                         |
| `APN_VOLUME`  | Monthly APN transaction volume metrics and chart.                         |

If a `DATA` sheet is not available, the dashboard uses the first sheet in the workbook as the incident dataset.

## Required DATA Columns

The dashboard expects these columns for the main incident view:

```text
Incident
Month
Partner
Status
PRIORITY
Region
Receive Country
Delayed Transaction
Delivery Breached
Transaction Loss(customer impact)
Impact type
```

Additional columns used by some KPIs and charts:

```text
Issue (WU issue/Partner side)
Issue subcategory
Wallet Name/Specific Bank
Time Taken for Resolution
```

## Optional Sheet Formats

### REROUTE

Used for rerouted transaction metrics.

```text
TXN_COUNT
SENDAMOUNTINUSD
PREVIOUS_PARTNER
CURRENT_PARTNER
RECEIVECOUNTRYCODE
STATUS
```

### APN_VOLUME

Used for APN monthly volume metrics.

```text
CREATED_DATE
COUNT(*)
```

### SUGGESTIONS

Used for the recommendations list.

```text
priority
suggestion
```

### CONFIG

Used for dashboard-level settings.

```text
key
value
```

Supported keys include:

```text
title
theme_color
```

## Usage

1. Start the local server.
2. Open `http://localhost:8000/index.html`.
3. Click `Auto Load` to load `data/payments_incident_sample.xlsx`, or use the file picker to upload another workbook.
4. Use the sidebar filters to narrow the dataset.
5. Switch between `Overview`, `Analytics`, and `Incidents` tabs.
6. Click `Reset` to clear filters.

## Main Files

- `index.html` defines the dashboard layout, filters, tabs, chart canvases, and table.
- `css/style.css` contains all dashboard styling.
- `js/data.js` loads Excel data, cleans rows, maps sheets, applies config, and initializes data state.
- `js/filters.js` populates filters and applies filter logic.
- `js/charts.js` contains Chart.js chart builders and shared chart helpers.
- `js/views.js` handles tab/view switching.
- `js/app.js` renders the executive summary, KPIs, metrics, suggestions, and incident table.

## Adding New Charts

See `js/adding_new_charts.md` for the project notes. The usual flow is:

1. Add a new `<canvas>` placeholder in `index.html`.
2. Add a chart function in `js/charts.js`.
3. Register the function inside `APP.draw`.
4. Add new filter support in `js/filters.js` if the chart needs another filter.

## Dependencies

Dependencies are loaded from CDN in `index.html`:

- SheetJS: `https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js`
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js`

No package installation is required for the current static version.
