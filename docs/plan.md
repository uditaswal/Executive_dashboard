# Dashboard Refactor + Dynamic Pivot Builder Plan

## Goal

Transform the current static executive dashboard into a:

- dynamic dashboard builder
- config-driven reporting system
- multi-tab PPT export platform
- scalable rejection analytics engine
- reusable template/config architecture

while still supporting:

- static HTML
- GitHub Pages deployment
- zero backend
- local Excel uploads

---

# HIGH LEVEL ARCHITECTURE

## Current

```text id="1p33ze"
Hardcoded HTML
   ↓
Hardcoded JS charts
   ↓
Manual PPT mapping
```

---

## Target

```text id="0hgf22"
Excel Upload
   ↓
Data Engine
   ↓
Dynamic Config Layer
   ↓
Pivot Builder
   ↓
Dynamic Renderer
   ↓
Dashboard Sections
   ↓
Export Engine
   ↓
PPT
```

---

# CORE CONCEPT

Everything becomes config-driven.

Instead of:

```js id="26e6h5"
createVendorChart();
createRejectionChart();
```

Use:

```js id="eky0t5"
renderWidget(widgetConfig);
```

---

# NEW FEATURES TO IMPLEMENT

---

# 1. Separate Rejections Tab

## Problem

Currently:

- incidents + rejections mixed visually
- hard to distinguish
- cluttered export selection

---

## Solution

Create dedicated tabs:

```text id="szv97m"
[ Overview ]
[ Incidents ]
[ Rejections ]
[ Vendor RCA ]
[ Executive Summary ]
```

---

## Rejections Tab Design

Use darker/red accent theme.

Example:

| Incidents   | Rejections |
| ----------- | ---------- |
| blue/purple | orange/red |

---

## Visual Differentiation

### Incidents

```css id="b0gt7z"
--primary: #4f46e5;
--accent: #818cf8;
```

### Rejections

```css id="6stwhx"
--primary: #dc2626;
--accent: #f97316;
```

---

## Add Icons

Example:

- Incidents → activity icon
- Rejections → alert triangle icon

Use:

- Lucide
- FontAwesome

---

# 2. Rejections Filters

## Add Top Filter Bar

Inside Rejections tab:

```text id="ab81z3"
[ Month ▼ ]
[ Partner ▼ ]
[ Delivery Service ▼ ]
[ Bank Name ▼ ]
[ Bank Code ▼ ]
[ Country ▼ ]
[ Status ▼ ]
```

---

## Required Filters

### Existing

- month
- partner
- country

### New

- delivery service
- bankname
- bankcode

---

## Filter Engine

All widgets inside rejection tab should react dynamically.

Architecture:

```js id="q82hnr"
globalFilters.rejections = {
  bankcode: [],
  bankname: [],
  deliveryService: [],
};
```

---

# 3. Handle 100k+ Rejection Records

## DO NOT render all rows

Critical.

---

# Required Optimizations

## A. Pagination

```text id="xkjsvf"
Showing 1-100 of 100,000
[ Prev ] [ Next ]
```

---

## B. Virtualized Tables

Use:

- Tabulator
  OR
- Grid.js
  OR
- AG Grid Community

Recommended:

[Tabulator](https://tabulator.info?utm_source=chatgpt.com)

Reason:

- virtualization
- pagination
- filtering
- export
- fast rendering

---

## C. Lazy Rendering

Never:

```js id="y59owh"
table.innerHTML += 100000 rows
```

Instead:

- render visible rows only

---

## D. Cached Aggregations

For charts:

- precompute pivot summaries once

Example:

```js id="sc93tr"
cache["rejections_by_bank_month"];
```

Avoid recalculating every chart repeatedly.

---

# 4. Dynamic Pivot Builder

## Goal

User should create:

- charts
- tables
- KPI cards
- summaries

WITHOUT code changes.

---

# Builder UI

## Dataset Toggle

```text id="u0z4k7"
(•) Incidents
( ) Rejections
```

---

## Widget Type

```text id="31q5cw"
Bar Chart
Line Chart
Pie Chart
Table
KPI
Summary
Heatmap
```

---

## Placement

```text id="g7r6u6"
Section:
[ Overview ▼ ]
[ Rejections ▼ ]
[ Vendor RCA ▼ ]
```

---

## Fields

```text id="azd3jk"
Rows
Columns
Values
Filters
Sort
Top N
```

---

# Example Generated Config

```js id="9d1m4q"
{
  id: "reject_by_bank",
  dataset: "rejections",
  section: "Rejections",
  type: "bar",
  rows: ["BANKNAME"],
  columns: ["MONTH"],
  values: ["COUNT"]
}
```

---

# Renderer

```js id="i6d9yt"
dashboardConfig.widgets.forEach(renderWidget);
```

---

# 5. Config-Based Architecture

## Store all widgets in config

```json id="ruzzv0"
{
  "widgets": []
}
```

---

# Config Sources

## A. Default Git Config

```text id="5ef3t0"
/configs/default-dashboard.json
```

---

## B. User Imported Config

```text id="g87swl"
Upload Config
```

---

## C. User Download Config

```text id="r93c4m"
Download Current Layout
```

---

# Local Storage Support

```js id="r0cux6"
localStorage.setItem("dashboard-config");
```

---

# 6. Export Engine Refactor

## Current Problem

Export tied to:

- hardcoded charts
- hardcoded slides

---

# New Export Architecture

## Export Modal

When clicking export:

```text id="1o93ya"
SELECT ITEMS TO EXPORT

[✓] Overview KPI
[✓] Vendor RCA
[✓] Rejection Tables
[ ] Partner Heatmap
[✓] Summary
```

Grouped by tabs.

---

# Export Structure

```text id="e9el9d"
Overview
  - KPI Cards
  - Trends

Incidents
  - Incident Charts
  - Summary

Rejections
  - Tables
  - Trends
```

---

# Default Export Profiles

## Example

```text id="4jllyh"
[ Save as Default Export ]
```

Stores:

```json id="a7jlwm"
{
  "defaultExport": ["overview_kpis", "reject_trends"]
}
```

---

# Export Profiles

```text id="x4xqci"
Executive Review
Monthly Ops
Vendor RCA
Reject Analysis
```

---

# PPT Export Improvements

## Export Across Tabs

Need centralized export registry.

---

# Every widget gets metadata

```js id="1if4ww"
{
   exportable: true,
   slideTitle: "Reject Trend"
}
```

---

# Export Engine

```js id="g3tr0u"
selectedWidgets.forEach((widget) => {
  exportWidgetToPPT(widget);
});
```

---

# 7. Summary Builder

Allow:

- AI summaries
- custom summaries
- KPI commentary

Config-driven.

Example:

```js id="78ec9w"
{
  type: "summary",
  dataset: "rejections",
  template: "Top rejecting partner was {{partner}}"
}
```

---

# 8. Guide Page + README Updates

Must include:

---

# README Sections

## A. Dashboard Architecture

Explain:

- config-driven widgets
- pivot builder
- export engine

---

## B. Creating New Charts

Explain:

- no code required
- use pivot builder

---

## C. Saving Configs

Explain:

- export/import JSON

---

## D. Git-Based Defaults

Explain:

- default configs stored in repo

---

## E. Performance

Explain:

- virtualization
- pagination
- caching

---

# GUIDE PAGE

Add UI guide:

## Sections

- Upload Data
- Create Widget
- Save Dashboard
- Export PPT
- Import Config
- Save Default Export

---

# RECOMMENDED TECH STACK

| Feature       | Library                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| Charts        | [Chart.js](https://www.chartjs.org?utm_source=chatgpt.com)               |
| Tables        | [Tabulator](https://tabulator.info?utm_source=chatgpt.com)               |
| Excel Parsing | [SheetJS](https://sheetjs.com?utm_source=chatgpt.com)                    |
| PPT Export    | [PptxGenJS](https://gitbrent.github.io/PptxGenJS?utm_source=chatgpt.com) |
| Drag Layout   | SortableJS                                                               |
| State         | localStorage                                                             |
| Icons         | Lucide                                                                   |

---

# FOLDER STRUCTURE

```text id="g2t25d"
/config
   default-dashboard.json
   export-profiles.json

/js
   renderer.js
   pivot-builder.js
   export-engine.js
   widget-registry.js
   state-manager.js
   filters.js

/components
   chart-card.js
   table-widget.js
   kpi-widget.js
   summary-widget.js

/styles
   incidents.css
   rejections.css
```

---

# PHASED IMPLEMENTATION PLAN FOR CODEX

---

# PHASE 1 — Rejections Refactor

## Tasks

- Create dedicated Rejections tab
- Add rejection filter bar
- Add bankname/bankcode filters
- Add pagination
- Integrate Tabulator
- Add virtual scrolling

---

# PHASE 2 — Dynamic Widget System

## Tasks

- Create widget schema
- Create widget registry
- Convert existing charts to configs
- Build generic renderer

---

# PHASE 3 — Pivot Builder

## Tasks

- Build drag/drop pivot UI
- Add dataset toggle
- Add chart selector
- Add section selector
- Add save widget feature

---

# PHASE 4 — Export Engine Rewrite

## Tasks

- Create export modal
- Multi-tab export selection
- Default export profiles
- Save export presets
- Auto-slide generation

---

# PHASE 5 — Config Management

## Tasks

- Import/export configs
- Local storage persistence
- Load git defaults
- Merge configs safely

---

# PHASE 6 — Documentation

## Tasks

- Update README
- Create guide page
- Add architecture diagrams
- Add usage walkthroughs

---

# IMPORTANT DESIGN PRINCIPLE

## NEVER AGAIN DO THIS

```js id="w7ycrz"
createPartnerChart();
createRejectChart();
createBankChart();
```

---

# ALWAYS DO THIS

```js id="03m3xj"
renderWidget(config);
```

This is the most important architectural shift in the project.
