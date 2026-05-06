# Adding New Charts And Tables

This guide reflects the current dashboard structure as of `2026-05-06`.

## Current Analytics Layout

The `Analytics` tab currently contains 22 chart canvases:

```text
c1   Monthly Incident Trend
c2   Incident Status Split
c3   Priority Distribution
c4   Top Partner Incident Ranking
c5   Top Receive Countries
c6   Delayed vs Breached Trend
c7   Transaction Loss by Partner
c10  APN Monthly Transaction Volume
c12  WU vs Partner Side Issues
c13  WU vs Partner Side Trend
c14  Partner Side Issue Category Trend
c15  Top Impacted Wallet Trend
c16  Top Partners by Delayed MTCNs
c17  Top Wallets by Delayed MTCNs
c18  Resolution Time Split
c19  Impact Type Split
c20  Issue Category by Month
c21  Monitoring Gap / Detection Delay
c22  Rejected Transactions by Partner
c23  Operational Impact by Month
c24  Receive Country Impact
c11  Insufficient Funds by Partner
```

Chart export order is controlled by `APP.exportOrder` in `js/charts.js`.

## Current Flow

To add a new chart and keep it aligned with the app:

1. Add a new `<canvas>` in `index.html`.
2. Add a chart renderer in `js/charts.js`.
3. Add the canvas id to `APP.exportOrder` in `js/charts.js`.
4. Call the renderer inside `APP.draw()`.
5. Add a matching table entry in `APP.getGraphTables()` if the chart should appear in the `Tables` tab and global exports.

## Step 1: Add The Canvas

Add a card in the `Analytics` section of `index.html`.

Standard card:

```html
<div class="card"><canvas id="c25"></canvas></div>
```

Wide card:

```html
<div class="card wide"><canvas id="c25"></canvas></div>
```

Use the next available canvas id and keep it unique.

## Step 2: Add The Chart Function

Create a renderer in `js/charts.js` using the existing helpers:

```js
function drawNewChartName() {
    const data = APP.cb("Column Name");

    APP.chart("c25", {
        type: "bar",
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: "Label",
                data: Object.values(data),
                backgroundColor: "#2563eb",
                borderRadius: 8
            }]
        },
        options: APP.chartOptions("Chart Title")
    });
}
```

Useful helpers already available:

- `APP.cb(key, rows)` for counts
- `APP.sumBy(groupKey, valueKey, rows)` for grouped sums
- `APP.topEntries(map, limit)` for ranking
- `APP.sortedMonths(rows)` for ordered month axes
- `APP.value(row, keyOrKeys)` for alias-safe field lookup
- `APP.issueOwner(row)` for WU versus partner normalization
- `APP.getReceiveCountryImpactEntries(limit)` as an example of shared chart/table aggregation

## Step 3: Add It To Export Order

Update `APP.exportOrder` in `js/charts.js`.

Example:

```js
APP.exportOrder = [
    "c1", "c2", "c3", "c4", "c5", "c6", "c7",
    "c10", "c12", "c13", "c14", "c15", "c16",
    "c17", "c18", "c19", "c20", "c21", "c22",
    "c23", "c24", "c11", "c25"
];
```

## Step 4: Render It In `APP.draw()`

Add the function call to the draw pipeline:

```js
APP.draw = () => {
    APP.destroy();

    drawMonthlyTrend();
    drawStatusDonut();
    // other existing charts
    drawInsufficientFundsTrend();
    drawNewChartName();
};
```

## Step 5: Add A Matching Table

If the chart should appear in the `Tables` tab and global table exports, add a table object inside `APP.getGraphTables()`.

Simple mapped table:

```js
APP.mapTable(
    "Chart Title",
    "Category",
    "Count",
    APP.cb("Column Name"),
    8
)
```

Monthly metrics table:

```js
APP.monthMetricRows(
    "Monthly Metrics",
    [
        { label: "Delayed", map: APP.sumBy("Month", "Delayed Transaction") },
        { label: "Breached", map: APP.sumBy("Month", "Delivery Breached") }
    ]
)
```

Stacked monthly table:

```js
APP.stackedMonthRows(
    "Issue Category by Month",
    categories,
    (category, month) =>
        APP.DATA.filter(
            row =>
                row.Month === month &&
                APP.value(row, ["issue category", "Issue subcategory"]) === category
        ).length
)
```

## Best Practice

When a chart and a table must stay perfectly aligned, compute the aggregation once and reuse it in both places.

The current receive-country impact implementation is the model:

- aggregation helper: `APP.getReceiveCountryImpactEntries()`
- chart renderer: `drawReceiveCountryImpact()`
- table output: `APP.getGraphTables()`

That pattern keeps filtered charts, tables, and exports consistent.

## Chart Label Toggle

The analytics page includes a `Show counts on charts` checkbox. New charts automatically participate in this behavior because labels are drawn by the shared Chart.js plugin registered at the top of `js/charts.js`.

Keep in mind:

- labels are only drawn when `APP.showChartLabels` is `true`
- charts must render standard dataset points so the plugin can locate `x` and `y`

## Export Implications

A new chart can participate in:

- PNG export
- PowerPoint export
- Excel export of chart data

Requirements:

- chart must be rendered through `APP.chart(id, config)`
- chart id must be included where selection or export order depends on it
- matching table must be added separately if table export is also required

## Quick Checklist

- [ ] Add `<canvas id="cXX"></canvas>` to `index.html`
- [ ] Add `draw...()` function in `js/charts.js`
- [ ] Add chart id to `APP.exportOrder`
- [ ] Call the function in `APP.draw()`
- [ ] Add matching data table in `APP.getGraphTables()` if needed
- [ ] Verify it renders under current filters
- [ ] Verify it appears in export selection
- [ ] Verify chart labels work when the toggle is enabled
