## to be updated at the very end

# To add new Graphs-

## 1. Add New Graph Logic → `js/charts.js`

`charts.js` should handle:

- aggregate Excel data
- count by month / partner / status
- sum numeric columns
- create Chart.js charts
- destroy/re-render charts on filter changes

---

## Current Best Practice Structure

```js
drawMonthlyTrend();
drawStatusDonut();
drawPriorityPie();
drawPartnerRanking();
drawCountryChart();
drawDelayedTxnChart();
drawLossChart();
```

Then use master draw:
APP.draw = () => {
APP.destroy();

drawMonthlyTrend();
drawStatusDonut();
drawPriorityPie();
drawPartnerRanking();
drawCountryChart();
drawDelayedTxnChart();
drawLossChart();
};

---

## 2. Add Canvas Placeholder → `index.html`

If new graph needs visual space, add:

```html
<div class="card">
  <canvas id="c7"></canvas>
</div>
```

Inside Overview / Analytics / Partner tab.

---

## 3. Add Filter Support → `js/filters.js`

If graph needs new filter like:

```text id="nb1jfj"
Issue Category
Country
Platform
Impact Type
```

Then:

- add dropdown in `index.html`
- populate values in `filters.js`
- include in filter logic

---

## 4. Add New KPI Instead of Graph → `js/app.js`

If you want metric card:

```text id="kw1l0k"
Avg Resolution Time
SLA %
Top Vendor
```

Then modify KPI render section.

---

# Real Example

## Add Graph: Incidents by Country

### Step 1 — HTML

```html
<canvas id="c7"></canvas>
```

---

### Step 2 — charts.js

```js
const country = APP.cb("Receive Country");

APP.charts.c7 = new Chart(c7, {
  type: "bar",
  data: {
    labels: Object.keys(country),
    datasets: [
      {
        label: "Incidents",
        data: Object.values(country),
      },
    ],
  },
});
```

---

# If Graph Uses Numeric Excel Columns

Example:

```text id="0k9jlr"
Delayed Transaction
Delivery Breached
Loss
```

Use SUM instead of count.

Example:

```js
let totals = {};

APP.DATA.forEach((r) => {
  totals[r.Partner] =
    (totals[r.Partner] || 0) + Number(r["Delayed Transaction"]);
});
```

---

# Best Practice Structure

## charts.js should look like:

```text id="50j0rr"
drawMonthlyTrend()
drawPriorityPie()
drawPartnerRanking()
drawCountryChart()
drawDelayedTxnChart()
drawLossChart()
```

Then master function:

```js
APP.draw = () => {
  drawMonthlyTrend();
  drawPriorityPie();
  drawCountryChart();
};
```

Much cleaner than one giant block.
