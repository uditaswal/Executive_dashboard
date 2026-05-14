# Codex Implementation Plan — Payments Dashboard Enhancements

**Project:** Payments Dashboard (GitHub Pages, plain HTML/CSS/JS + Chart.js)  
**File:** `index.html` + `js/data.js`, `js/filters.js`, `js/charts.js`, `js/app.js`, `js/views.js`, `css/style.css`  
**Constraint:** No build tools, no Node.js server. Must work on GitHub Pages (static file hosting). SheetJS already loaded via CDN.

---

## FEATURE 1 — In-Browser Excel Normalization Pipeline

### Goal

After a workbook is loaded (auto-load or manual upload), run a normalization pass on every sheet **in memory** before any chart or filter logic reads the data. The normalized in-memory copy is what the rest of the app uses. The user's original file on disk is never touched.

### Where to implement

**`js/data.js`** — after SheetJS parses the workbook and before `window.APP.raw` is populated.

### Normalization rules — DATA sheet (and REJECTIONDATA sheet)

Apply to **every string cell** in the following columns. Use a shared helper `normalizeCell(value, type)`.

| Column(s)                                                  | Type key    | Rule                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Month`                                                    | `month`     | Trim → Title-case first 3 letters → map to canonical `Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec`. Accept `Jan-26`, `01`, `January`, `JAN`, `jan` etc. and output `Jan` |
| `Partner`, `PARTNERNAME`                                   | `upper`     | Trim → UPPER CASE → collapse internal spaces to single space                                                                                                                 |
| `Receive Country`, `RECEIVECOUNTRYCODE`, `SENDCOUNTRYCODE` | `upper`     | Trim → UPPER CASE (2–3 letter codes)                                                                                                                                         |
| `DELIVERYSERVICE`                                          | `upper`     | Trim → UPPER CASE → replace spaces/hyphens with underscore                                                                                                                   |
| `CHANNEL`, `SENDINGCHANNEL`                                | `upper`     | Trim → UPPER CASE                                                                                                                                                            |
| `Wallet Name/Specific Bank`, `BANKNAME`                    | `titlecase` | Trim → Title Case → collapse spaces                                                                                                                                          |
| `Status`, `SUBSTATE`                                       | `titlecase` | Trim → Title Case                                                                                                                                                            |
| `PRIORITY`                                                 | `priority`  | Trim → numeric string. Accept `P1`, `p1`, `Priority 1`, `1` → output `1`                                                                                                     |
| `Region`                                                   | `upper`     | Trim → UPPER CASE                                                                                                                                                            |
| `Issue Category`, `issue category`                         | `titlecase` | Trim → Title Case                                                                                                                                                            |
| `PURPOSE`                                                  | `upper`     | Trim → UPPER CASE                                                                                                                                                            |
| All other string columns                                   | `trim`      | Trim + collapse internal double-spaces only                                                                                                                                  |

### Month canonical mapping table

```
january / jan / 1 / 01  → Jan
february / feb / 2 / 02 → Feb
march / mar / 3 / 03    → Mar
april / apr / 4 / 04    → Apr
may / 5 / 05            → May
june / jun / 6 / 06     → Jun
july / jul / 7 / 07     → Jul
august / aug / 8 / 08   → Aug
september / sep / 9 / 09 → Sep
october / oct / 10      → Oct
november / nov / 11     → Nov
december / dec / 12     → Dec
```

Strip year suffixes: `Jan-26`, `Jan 2026`, `Jan26` → `Jan`.

### Implementation sketch (data.js)

```js
// Add near top of data.js
const MONTH_MAP = {
  january: "Jan",
  jan: "Jan",
  1: "Jan",
  "01": "Jan",
  february: "Feb",
  feb: "Feb",
  2: "Feb",
  "02": "Feb",
  // ... full map for all 12
};

function normalizeCell(val, type) {
  if (val == null) return val;
  let s = String(val)
    .trim()
    .replace(/_x000d_/g, "")
    .replace(/\s+/g, " ");
  if (type === "month") {
    // strip year part e.g. "-26", " 2026"
    s = s
      .replace(/[-\s]?\d{2,4}$/, "")
      .toLowerCase()
      .replace(/\s/g, "");
    return MONTH_MAP[s] || val;
  }
  if (type === "upper") return s.toUpperCase();
  if (type === "titlecase")
    return s.replace(
      /\w\S*/g,
      (w) => w[0].toUpperCase() + w.slice(1).toLowerCase(),
    );
  if (type === "priority") return s.replace(/[^\d]/g, "") || val; // strip P, spaces
  return s; // trim only
}

// Column type registry — normalized column key → type
const COL_TYPES = {
  month: "month",
  partner: "upper",
  partnername: "upper",
  receivecountry: "upper",
  receivecountrycode: "upper",
  sendcountrycode: "upper",
  deliveryservice: "upper",
  channel: "upper",
  sendingchannel: "upper",
  walletname: "titlecase",
  bankname: "titlecase",
  status: "titlecase",
  substate: "titlecase",
  priority: "priority",
  region: "upper",
  issuecategory: "titlecase",
  purpose: "upper",
};

function normalizeSheet(rows) {
  if (!rows || !rows.length) return rows;
  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      const key = k.toLowerCase().replace(/[^a-z0-9]/g, "");
      const type = COL_TYPES[key] || "trim";
      out[k] = typeof v === "string" ? normalizeCell(v, type) : v;
    }
    return out;
  });
}
```

Call `normalizeSheet()` on DATA rows and REJECTIONDATA rows immediately after SheetJS `.sheet_to_json()`.

### GitHub Pages compatibility

- All processing is synchronous, in-memory JS — no server calls, no file writes.
- The auto-load path (`fetch('data/payments_incident_sample.xlsx')`) and the manual upload path both feed through the same normalization function.
- No changes needed to `index.html` or any CDN script.

---

## FEATURE 2 — Rejections Panel (REJECTIONDATA sheet)

### Excel sheet expected

Sheet name: `REJECTIONDATA` (also match `Rejection Data`, `rejectiondata`, `PAYOUT_DATA`, `PayoutData` via normalized sheet matching).

### Columns used (from sample file)

| Column                 | Usage                                            |
| ---------------------- | ------------------------------------------------ |
| `MONTH`                | Trend axis, filters                              |
| `PARTNERNAME`          | Partner breakdown                                |
| `RECEIVECOUNTRYCODE`   | Country breakdown                                |
| `SENDCOUNTRYCODE`      | Send country                                     |
| `DELIVERYSERVICE`      | Delivery breakdown                               |
| `CHANNEL`              | Channel breakdown                                |
| `SENDINGCHANNEL`       | Sub-channel                                      |
| `PURPOSE`              | Purpose breakdown                                |
| `SUBSTATE`             | State of record (REJECTED / PENDING / COMPLETED) |
| `PARTNER_REJECTREASON` | Partner-side reject reason                       |
| `APN_REJECTREASON`     | APN-side reject reason                           |
| `STATUS`               | Raw status code (e.g. `78\|78`)                  |
| `BANKNAME`             | Bank breakdown                                   |
| `DESCRIPTION`          | Free-text description                            |

**A "rejection" row** = any row where `SUBSTATE === 'REJECTED'` OR `PARTNER_REJECTREASON` is non-null. Use this as the default filter for rejection-specific charts, but show all rows in the register.

---

### 2a — New Tab in Main Navigation

Add a **`Rejections`** tab button alongside Overview / Pivot / Analytics / Tables / Incidents.

```html
<button class="tab" data-view="rejections">Rejections</button>
```

Add a corresponding `<section id='rejections' class='view hide'>` in `index.html`.

---

### 2b — Rejection KPI Cards (top of Rejections section)

Four KPI cards in the same style as the Overview KPIs:

| Card                 | Calculation                                             |
| -------------------- | ------------------------------------------------------- |
| **Total Records**    | Count of all REJECTIONDATA rows (after sidebar filters) |
| **Total Rejected**   | Count where SUBSTATE = REJECTED                         |
| **Rejection Rate %** | (Rejected / Total) × 100                                |
| **Unique Partners**  | Count distinct PARTNERNAME                              |

---

### 2c — Rejection Charts (14 charts)

Render inside the Rejections section in the same `card / canvas` structure as Analytics. All charts respond to the sidebar filters (Month, Partner, Receive Country) — the existing filter sidebar gains three new dropdowns added at the bottom: **Partner Name**, **Receive Country (Rejection)**, **Delivery Service** — mapped to REJECTIONDATA columns.

| ID     | Title                              | Type           | X-axis / Groups                                 | Y-axis                             |
| ------ | ---------------------------------- | -------------- | ----------------------------------------------- | ---------------------------------- |
| `rc1`  | Monthly Rejection Trend            | Bar            | MONTH                                           | Count of rejected rows             |
| `rc2`  | Rejection by Partner               | Horizontal Bar | PARTNERNAME                                     | Count                              |
| `rc3`  | Rejection by Receive Country       | Horizontal Bar | RECEIVECOUNTRYCODE                              | Count                              |
| `rc4`  | Partner Reject Reason Breakdown    | Doughnut       | PARTNER_REJECTREASON                            | Count                              |
| `rc5`  | APN Reject Reason Breakdown        | Doughnut       | APN_REJECTREASON                                | Count                              |
| `rc6`  | Rejection by Delivery Service      | Pie            | DELIVERYSERVICE                                 | Count                              |
| `rc7`  | Rejection by Channel               | Bar            | CHANNEL                                         | Count                              |
| `rc8`  | Rejection by Purpose               | Horizontal Bar | PURPOSE                                         | Count                              |
| `rc9`  | Substate Distribution              | Doughnut       | SUBSTATE                                        | Count                              |
| `rc10` | Top Banks by Rejection             | Horizontal Bar | BANKNAME                                        | Count                              |
| `rc11` | Monthly Trend by Partner (stacked) | Stacked Bar    | MONTH (x) + PARTNERNAME (series)                | Count                              |
| `rc12` | Monthly Trend by Delivery Service  | Line           | MONTH (x) + DELIVERYSERVICE (series)            | Count                              |
| `rc13` | Partner Reject Reason by Partner   | Stacked Bar    | PARTNERNAME (x) + PARTNER_REJECTREASON (series) | Count                              |
| `rc14` | Send vs Receive Country Matrix     | Horizontal Bar | RECEIVECOUNTRYCODE                              | Count (colored by SENDCOUNTRYCODE) |

All charts respect the **Top N filter** described in Feature 3.

---

### 2d — Rejection Data Tables

Mirror each chart with a sortable HTML table (same pattern as Tables view). Place in a **"Rejection Tables"** subtab within the Rejections section, OR add them to the existing Tables view under a heading.

Tables to generate:

1. Monthly Rejection Trend table
2. Rejection by Partner table
3. Rejection by Country table
4. Partner Reject Reason table
5. APN Reject Reason table
6. Delivery Service table
7. Channel table
8. Purpose table
9. Bank table
10. Partner + Reason cross-table

---

### 2e — Rejection Register (sub-table)

A scrollable table at the bottom of the Rejections section showing raw rows (capped at 500 rows), with the same column-picker pattern as the Incidents register. Default columns:

```
MONTH, PARTNERNAME, RECEIVECOUNTRYCODE, DELIVERYSERVICE,
CHANNEL, SUBSTATE, PARTNER_REJECTREASON, APN_REJECTREASON,
DESCRIPTION, PURPOSE
```

---

### 2f — Pivot Builder support

The existing Pivot Builder in `js/charts.js` reads from `window.APP.filtered` (DATA rows). Add a **dataset toggle** at the top of the Pivot Builder:

```
[Pivot on:  ● Incidents  ○ Rejections ]
```

When "Rejections" is selected, the pivot builder reads from `window.APP.filteredRejections` (the filtered REJECTIONDATA rows) and populates the Rows/Columns/Values dropdowns from REJECTIONDATA column names instead.

No other pivot code changes needed — the same aggregation and chart rendering logic works for any array of objects.

---

### 2g — Export support

The existing Export modal lists exportable items. Add rejection charts and rejection tables to the export list so they can be exported to PNG, PPT, and Excel alongside incident charts.

---

## FEATURE 3 — Top N Filter for Charts and Tables

### Goal

Let users choose to show Top 5, Top 10, Top 20, or All items in any chart/table that groups by a categorical dimension (partner, country, bank, reason, wallet, etc.).

### UI placement

Add a control in **two places**:

1. **Analytics section** — next to the existing "Show counts on charts" checkbox:

   ```
   Show top: [All ▾]  (dropdown: All, 5, 10, 20)
   ```

2. **Rejections section** — same control, same style.

One global state variable per section: `window.APP.analyticsTopN` (default `null` = All) and `window.APP.rejectionsTopN`.

### Implementation in charts.js

Add a helper used by every categorical chart build function:

```js
function applyTopN(entries, n) {
  // entries = [{label, value}, ...]
  if (!n) return entries;
  return entries.sort((a, b) => b.value - a.value).slice(0, n);
}
```

Every chart that iterates over grouped keys (partner, country, reason, etc.) passes its sorted entries through `applyTopN(entries, window.APP.analyticsTopN)` before building labels and data arrays.

Tables apply the same function before rendering rows — add a "showing top N of total" label above each table when N is active.

The Top N dropdown fires `rebuildCharts()` and `rebuildTables()` on change (same event pattern as the filter Apply button).

---

## FEATURE 4 — Data Guide Page

### Approach

A new tab **`Guide`** in the main navigation (rightmost tab, styled differently — e.g. a `?` icon or muted color to distinguish it from data tabs).

```html
<button class="tab guide-tab" data-view="guide">Guide</button>
```

Add a `<section id='guide' class='view hide'>` with static HTML content — no JS needed, no external fetch, works perfectly on GitHub Pages.

### Content structure for the Guide section

The guide is written as styled HTML (not markdown) using the existing `card` and `section-box` CSS classes so it matches the dashboard look.

#### Section 1 — Workbook Overview

- Supported sheet names (DATA, REJECTIONDATA, CONFIG, SUGGESTIONS, REROUTE, APN_VOLUME)
- How to add the workbook (auto-load path `data/` folder, or manual upload)
- Note that sheet name casing and spacing is tolerated

#### Section 2 — DATA Sheet Reference

Full column reference table:

| Column Name                         | Required    | Format                  | Example         | Notes                              |
| ----------------------------------- | ----------- | ----------------------- | --------------- | ---------------------------------- |
| Incident                            | Yes         | Text                    | INC5367010      | Unique incident ID                 |
| Month                               | Yes         | Jan–Dec                 | Mar             | Year suffix stripped automatically |
| Partner                             | Yes         | Text                    | GCASH           | Normalised to UPPER CASE           |
| Status                              | Yes         | Text                    | Resolved        | Normalised to Title Case           |
| PRIORITY                            | Yes         | 1–4                     | 2               | Accepts P1, Priority 1, p1         |
| Region                              | Recommended | Text                    | LACA            | Normalised to UPPER CASE           |
| Receive Country                     | Recommended | 2-letter code           | PH              | Normalised to UPPER CASE           |
| Issue(WU/Partner)                   | Recommended | WU issue / Vendor issue | WU issue        | Drives owner classification        |
| Issue Category                      | Recommended | WU Side / Partner Side  | Partner Side    | Drives RCA tables                  |
| Delayed Transaction                 | Recommended | Integer                 | 12345           | Used in KPI and loss charts        |
| Delivery Breached                   | Recommended | Integer                 | 8900            | Used in SLA charts                 |
| Transaction Loss(customer impact)   | Optional    | Number                  | 45000           | USD value                          |
| Transaction REJECTED                | Optional    | Integer                 | 120             | Count of rejected MTCNs            |
| Time Taken for Resolution           | Recommended | Text                    | 1-3 days        | Drives resolution breakdown        |
| Monitoring Gap / delay In detection | Optional    | Text                    | More than 1 day | Drives monitoring chart            |
| Impact type                         | Recommended | Text                    | Major impact    | Drives impact chart                |

#### Section 3 — REJECTIONDATA Sheet Reference

| Column Name          | Required    | Format                            | Example                   |
| -------------------- | ----------- | --------------------------------- | ------------------------- |
| MONTH                | Yes         | Jan-26 or Jan                     | Jan-26                    |
| PARTNERNAME          | Yes         | Text                              | MASTERCARD                |
| RECEIVECOUNTRYCODE   | Yes         | 2-letter                          | PH                        |
| SENDCOUNTRYCODE      | Recommended | 2-letter                          | US                        |
| DELIVERYSERVICE      | Recommended | BANK / CASH_PICKUP / CARD         | BANK                      |
| CHANNEL              | Recommended | API / MOBILE / BRANCH / WEBMDC    | MOBILE                    |
| SENDINGCHANNEL       | Optional    | ONLINE / DIGITAL / AGENT          | ONLINE                    |
| SUBSTATE             | Yes         | REJECTED / PENDING / COMPLETED    | REJECTED                  |
| PARTNER_REJECTREASON | Recommended | Text                              | LIMIT_EXCEEDED            |
| APN_REJECTREASON     | Optional    | Text                              | AML_CHECK                 |
| PURPOSE              | Optional    | FAMILY_SUPPORT / EDUCATION / etc. | SALARY                    |
| BANKNAME             | Optional    | Text                              | HDFC BANK                 |
| DESCRIPTION          | Optional    | Text                              | Beneficiary Name Mismatch |

#### Section 4 — Auto-Normalization Reference

Explain what gets auto-fixed on upload:

- Month values like `January`, `JAN`, `01`, `Jan-26` all become `Jan`
- Partner names trimmed and uppercased
- Country codes uppercased
- Delivery service values uppercased
- Priority values like `P1`, `Priority 1` become `1`

Include a **"Before / After" example table**:

| Column          | Raw value in Excel | After normalisation |
| --------------- | ------------------ | ------------------- |
| Month           | `january`          | `Jan`               |
| Month           | `Jan-26`           | `Jan`               |
| Partner         | `gcash`            | `GCASH`             |
| PRIORITY        | `P1`               | `1`                 |
| DELIVERYSERVICE | `Cash Pickup`      | `CASH_PICKUP`       |
| Receive Country | `ph`               | `PH`                |

#### Section 5 — Common Mistakes

- Mixing `WU Issue` and `wu issue` in the same column → fixed by normalisation
- Leaving month as `Jan-26` or `01/2026` → fixed by normalisation
- Numeric priorities stored as text `"P2"` → fixed by normalisation
- Split delivery service values (`BANK` vs `Bank Transfer`) — **not** auto-fixed, must be consistent in source
- Duplicate sheet names with different casing — first match wins

#### Section 6 — CONFIG Sheet

Key/value table with supported keys (`title`, `theme_color`) and example values.

#### Section 7 — Running Locally

```
python -m http.server 8000
# then open http://localhost:8000/index.html
```

#### Section 8 — Export Notes

- PNG: captures the visible chart/table using html2canvas
- PPT: uses PptxGenJS, each item becomes a slide
- Excel: each chart/table becomes a separate sheet; file named `dashboard-export-<period>.xlsx`

---

## File-by-file Change Summary for Codex

| File            | Changes                                                                                                                                                                                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `js/data.js`    | Add `normalizeCell()`, `normalizeSheet()`, `MONTH_MAP`, `COL_TYPES`. Call `normalizeSheet()` on DATA and REJECTIONDATA after SheetJS parse. Load REJECTIONDATA sheet into `window.APP.rejections`. Add `window.APP.filteredRejections`.                                                       |
| `js/filters.js` | Add filter dropdowns for REJECTIONDATA (Partner Name, Receive Country, Delivery Service). Add `applyRejectionFilters()` that filters `window.APP.rejections` into `window.APP.filteredRejections`. Wire to Apply/Reset buttons.                                                               |
| `js/charts.js`  | Add `applyTopN()` helper. Apply to all categorical charts. Add 14 rejection chart build functions (`buildRejectionCharts()`). Add rejection graph-data tables. Add Top N dropdown handler for both Analytics and Rejections sections. Register rejection charts/tables in export order array. |
| `js/app.js`     | Add Rejection KPI cards render. Add Rejection Register render. Add pivot dataset toggle logic.                                                                                                                                                                                                |
| `js/views.js`   | Add `rejections` and `guide` to the tab switch map.                                                                                                                                                                                                                                           |
| `index.html`    | Add `<button>` tabs for Rejections and Guide. Add `<section>` elements for both. Add canvas elements `rc1`–`rc14`. Add static guide HTML content. Add Top N dropdown controls.                                                                                                                |
| `css/style.css` | Style the Guide section (`.guide-section`, `.guide-table`). Style the dataset toggle in the Pivot Builder. Style the Top N dropdown.                                                                                                                                                          |

---

## Suggested Implementation Order for Codex

1. **data.js normalization** — implement and verify with console logs before touching UI.
2. **REJECTIONDATA loading** — load sheet, store in `window.APP.rejections`, confirm columns.
3. **Rejection filters** — add dropdowns, wire `applyRejectionFilters()`.
4. **Rejections tab + KPI cards** — HTML scaffold + KPI render.
5. **Rejection charts (rc1–rc10)** — single-dimension charts first.
6. **Rejection charts (rc11–rc14)** — multi-series / stacked charts.
7. **Rejection tables and register** — mirror chart data as tables.
8. **Top N filter** — add `applyTopN()`, wire dropdown, apply to ALL existing + new charts.
9. **Pivot dataset toggle** — add toggle, wire `filteredRejections` to pivot builder.
10. **Guide page** — static HTML, no logic.
11. **Export updates** — add rejection items to export modal list.
12. **Final CSS pass** — ensure Guide and Rejections sections match existing visual style.

---

## Notes for Codex

- Do **not** introduce npm, webpack, vite, or any build tool. All JS must be plain ES5/ES6 in `<script>` tags or `.js` files loaded via `<script src>`.
- Do **not** use `fetch()` for anything other than the auto-load workbook path — all other data is in-memory from the uploaded file.
- The Top N control should be a `<select>` element, not a custom widget, so it renders correctly on GitHub Pages without any component library.
- All new canvas elements must have unique IDs (`rc1`–`rc14`).
- The Guide section must be pure static HTML — no API calls, no dynamic content.
- Maintain the existing chart destroy-and-recreate pattern (`if (window.CHARTS.X) window.CHARTS.X.destroy()`) for all new rejection charts.
- All new charts must be registered in the export modal item list using the same structure as existing charts.
