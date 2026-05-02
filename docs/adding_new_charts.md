# Complete Guide: Adding New Charts and Tables

---

## PART 1: ADDING NEW CHARTS

### Overview
Charts are rendered in the **Analytics** tab and appear in the export panel. The process involves:
1. Define chart logic in `js/charts.js`
2. Add canvas placeholder in `index.html`
3. Add to `APP.exportOrder` in `js/charts.js`
4. Add to `APP.draw()` function to render

---

### Step 1: Create Chart Logic Function in `js/charts.js`

All chart functions follow this pattern. Add a new function like:

```js
function drawNewChartName() {
    // 1. Aggregate data
    const data = APP.cb("Column Name");
    // or for sums: const data = APP.sumBy("GroupColumn", "NumericColumn");
    
    // 2. Create chart config
    APP.chart("canvasId", {
        type: "bar", // or "pie", "doughnut", "line", etc.
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: "Label Name",
                data: Object.values(data),
                backgroundColor: APP.colors
                // or custom colors: ["#2563eb", "#16a34a"]
            }]
        },
        options: APP.chartOptions("Chart Title")
    });
}
```

**Common Aggregation Methods:**

- **Count by Category:** `APP.cb("Column Name")` - counts occurrences
- **Sum Numeric Column:** `APP.sumBy("GroupColumn", "NumericColumn")` - sums values
- **Get Top Entries:** `APP.topEntries(data, 6)` - top 6 entries sorted by value

---

### Step 2: Add Canvas Placeholder in `index.html`

In the **Analytics** section, find the charts area and add:

```html
<div class="card"><canvas id="c24"></canvas></div>
```

For wide charts (spans 2 columns):
```html
<div class="card wide"><canvas id="c24"></canvas></div>
```

Canvas IDs should follow pattern: `c1`, `c2`, `c3`... `c24`, etc.

---

### Step 3: Add Canvas ID to `APP.exportOrder` in `js/charts.js`

Find this array:
```js
APP.exportOrder = [
    "c1", "c2", "c3", "c4", "c5", "c6", "c7",
    "c10", "c12", "c13", "c14", "c15", "c16",
    "c17", "c18", "c19", "c20", "c21", "c22",
    "c23", "c11"
];
```

Add your new canvas ID (e.g., "c24") in the order you want it to appear in exports.

---

### Step 4: Call Function in `APP.draw()` in `js/charts.js`

Find the `APP.draw()` function at the end of charts.js:

```js
APP.draw = () => {
    APP.destroy();

    drawMonthlyTrend();
    drawStatusDonut();
    // ... other functions ...
    drawNewChartName();  // ← Add your new function here
};
```

---

### Complete Example: Adding "Issues by Priority and Month" Chart

**Step 1: Add function to charts.js**
```js
function drawPriorityByMonth() {
    const months = APP.sortedMonths();
    const priorities = ["1", "2", "3", "4"];

    APP.chart("c24", {
        type: "bar",
        data: {
            labels: months,
            datasets: priorities.map((priority, i) => ({
                label: `Priority ${priority}`,
                data: months.map(month =>
                    APP.DATA.filter(row =>
                        row.Month === month && 
                        String(row.PRIORITY) === priority
                    ).length
                ),
                backgroundColor: APP.colors[i]
            }))
        },
        options: {
            ...APP.chartOptions("Priority Distribution by Month"),
            scales: {
                y: { stacked: true, beginAtZero: true },
                x: { stacked: true }
            }
        }
    });
}
```

**Step 2: Add to index.html**
```html
<div class="card wide"><canvas id="c24"></canvas></div>
```

**Step 3: Add to APP.exportOrder**
```js
APP.exportOrder = [
    "c1", "c2", "c3", "c4", "c5", "c6", "c7",
    "c10", "c12", "c13", "c14", "c15", "c16",
    "c17", "c18", "c19", "c20", "c21", "c22",
    "c23", "c11", "c24"  // ← Added here
];
```

**Step 4: Add to APP.draw()**
```js
APP.draw = () => {
    APP.destroy();
    drawMonthlyTrend();
    drawStatusDonut();
    // ... other functions ...
    drawPriorityByMonth();  // ← Added here
};
```

---

## PART 2: ADDING NEW TABLES

### Overview
Tables are rendered in the **Tables** tab. They automatically populate from `APP.getGraphTables()` function in `js/charts.js`. Tables show the data behind charts.

---

### Step 1: Add Table Data Logic in `js/charts.js`

Find the `APP.getGraphTables()` function (around line 285). It returns an array of table objects.

Each table object has this structure:
```js
{
    title: "Table Title",
    headers: ["Column 1", "Column 2", "Column 3"],
    rows: [
        ["Value1", "Value2", "Value3"],
        ["Value1", "Value2", "Value3"],
        // ... more rows
    ]
}
```

Add a new table using the `APP.mapTable()` helper:

```js
// Inside APP.getGraphTables()
const newTable = APP.mapTable(
    "Table Title",           // title
    "Label Column",          // header for first column
    "Count/Value Column",    // header for value column
    APP.cb("ColumnName"),    // aggregated data
    8                        // limit to top 8 entries
);
```

Then push to the tables array:
```js
const graphTables = [
    // ... existing tables ...
    newTable
];
```

---

### Step 2: Use Helper Functions for Common Patterns

**For Category Counts (Label + Count + Percentage):**
```js
APP.mapTable(
    "Issues by Partner",
    "Partner Name",
    "Incident Count",
    APP.cb("Partner"),
    10
)
```

**For Monthly Metrics (Month + Multiple Metrics):**
```js
APP.monthMetricRows(
    "Monthly Metrics",
    [
        { label: "Delayed", map: APP.sumBy("Month", "Delayed Transaction") },
        { label: "Breached", map: APP.sumBy("Month", "Delivery Breached") }
    ]
)
```

**For Stacked Group Data (Group + Months + Total):**
```js
APP.stackedMonthRows(
    "Issues by Status",
    ["Open", "Closed", "Resolved"],
    (status, month) =>
        APP.DATA.filter(r =>
            r.Month === month && r.Status === status
        ).length
)
```

---

### Complete Example: Adding "Resolution Time by Priority" Table

Find `APP.getGraphTables()` function and add:

```js
const resolutionTable = APP.mapTable(
    "Average Resolution Time by Priority",
    "Priority",
    "Avg Days",
    (() => {
        const data = {};
        ["1", "2", "3", "4"].forEach(priority => {
            const rows = APP.DATA.filter(r => String(r.PRIORITY) === priority);
            const avgTime = rows.length 
                ? rows.reduce((sum, r) => sum + APP.n(r["Time Taken for Resolution"]), 0) / rows.length
                : 0;
            data[`P${priority}`] = Math.round(avgTime);
        });
        return data;
    })(),
    4
);
```

Then in the return array:
```js
const graphTables = [
    // ... existing tables ...
    resolutionTable  // ← Add here
];
```

---

## PART 3: CONNECTING CHARTS TO TABLES

### How It Works
1. When you create a chart in `js/charts.js`, create a corresponding table in `APP.getGraphTables()`
2. The chart and table should show the same data
3. Tables automatically appear in the **Tables** tab
4. Users can see the raw data behind each chart

---

### Best Practice: Pair Charts with Tables

```js
// Chart Function
function drawCustomChart() {
    const data = APP.cb("SomeColumn");
    APP.chart("c25", {
        type: "bar",
        data: {
            labels: Object.keys(data),
            datasets: [{ data: Object.values(data) }]
        },
        options: APP.chartOptions("Chart Title")
    });
}

// In APP.getGraphTables()
const customTable = APP.mapTable(
    "Chart Title",  // Same title as chart
    "Category",
    "Count",
    APP.cb("SomeColumn"),  // Same aggregation as chart
    10
);
```

---

## PART 4: CHART TYPES REFERENCE

### Bar Chart
```js
APP.chart("cX", {
    type: "bar",
    data: { labels: [...], datasets: [{...}] },
    options: APP.chartOptions("Title")
});
```

### Pie Chart
```js
APP.chart("cX", {
    type: "pie",
    data: { labels: [...], datasets: [{...}] },
    options: APP.chartOptions("Title", { scales: {} })  // No scales for pie
});
```

### Doughnut Chart
```js
APP.chart("cX", {
    type: "doughnut",
    data: { labels: [...], datasets: [{...}] },
    options: APP.chartOptions("Title", { cutout: "62%", scales: {} })
});
```

### Line Chart
```js
APP.chart("cX", {
    type: "line",
    data: {
        labels: [...],
        datasets: [{
            data: [...],
            borderColor: "#2563eb",
            backgroundColor: "#2563eb",
            tension: 0.35,
            fill: false
        }]
    },
    options: APP.chartOptions("Title")
});
```

### Stacked Bar Chart
```js
options: {
    ...APP.chartOptions("Title"),
    scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
    }
}
```

---

## PART 5: QUICK CHECKLIST

When adding a new chart AND table:

- [ ] Create `drawNewChartName()` function in `js/charts.js`
- [ ] Add corresponding table logic in `APP.getGraphTables()`
- [ ] Add canvas placeholder in `index.html` (e.g., `<canvas id="c24"></canvas>`)
- [ ] Add canvas ID to `APP.exportOrder` array in `js/charts.js`
- [ ] Add function call to `APP.draw()` function in `js/charts.js`
- [ ] Test in Analytics tab (charts appear)
- [ ] Test in Tables tab (data shows)
- [ ] Test export (JPG/PPT includes chart if selected)
- [ ] Test count labels toggle works on new chart

---

## PART 6: COMMON DATA OPERATIONS

**Get Unique Values:**
```js
APP.u(APP.DATA.map(r => r.Partner))  // Returns array of unique partners
```

**Count Rows by Category:**
```js
APP.cb("Partner")  // Returns {Partner1: 5, Partner2: 3, ...}
```

**Sum Numeric Column by Group:**
```js
APP.sumBy("Partner", "Delayed Transaction")  // Returns {Partner1: 150, Partner2: 75, ...}
```

**Get Top N Entries:**
```js
APP.topEntries(dataMap, 5)  // Returns top 5 sorted by value
```

**Get Sorted Months:**
```js
APP.sortedMonths()  // Returns months in chronological order
```

**Filter Data:**
```js
APP.DATA.filter(r => r.Status === "Open")  // Filter for open incidents
```

**Get Value (with fallback):**
```js
APP.value(row, "Column")  // Safe value access
APP.value(row, ["Column1", "Column2"])  // Try multiple columns
```
