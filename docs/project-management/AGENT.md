# AI Agent Context — Dashboard Project

**Last Updated:** May 2026

---

## Project Overview

**Dashboard for Executive View** is a config-driven, data-visualization platform built on vanilla JavaScript (no framework) that processes Excel workbooks, applies real-time filtering, and generates interactive charts, tables, and PowerPoint exports.

**Purpose:** Enable executives and operations teams to analyze payment incidents and rejection data through multiple lenses (monthly trends, partner breakdowns, vendor RCA) with live filtering, dynamic pivoting, and export-to-presentation workflows.

---

## Architecture at a Glance

### Core Modules

| Module | File | Purpose |
|--------|------|---------|
| **Data Store** | `js/data.js` | Central state: RAW (raw Excel), DATA (filtered incidents), REJECTIONS, charts, views |
| **App Controller** | `js/app.js` | Orchestrates all logic: rendering, filtering, export, tab management |
| **Filters** | `js/filters.js` | Multi-select dropdown logic; drives data re-aggregation on filter change |
| **Charts** | `js/charts.js` | Chart.js setup, plugins, styling, data labels |
| **Views** | `js/views.js` | Tab switching; shows/hides dashboard sections |
| **Tab Manager** | `js/tab-manager.js` | Config-driven tab creation, visibility, export grouping |
| **Widget Renderer** | `js/widget-renderer.js` | Renders charts, tables, KPIs, summaries from config |
| **Rejection Filter Bar** | `js/rejection-filter-bar.js` | Accordion filter UI for rejections tab |
| **Runtime Init** | `js/runtime.js` | Startup: section config, Excel load, initial render |

### Services (Pluggable)

| Service | File | Purpose |
|---------|------|---------|
| **Config Service** | `services/config-service.js` | localStorage persistence, JSON backup/import, bundled config fallback |
| **Export Service** | `services/export-service.js` | Orchestrates PNG, PPT, Excel exports |
| **Pivot Engine** | `services/pivot-engine.js` | Aggregations: group, count, pivot, rank (topN) |
| **Cache Service** | `services/cache-service.js` | Memoizes expensive aggregations |
| **Widget Registry** | `services/widget-registry.js` | Registry for custom widget renderers |

### Styling

| File | Purpose |
|------|---------|
| `css/style.css` | Global layout, header, sidebar, modals, typography, color palette |
| `css/rejections.css` | Rejections tab theme (red/orange accents); scoped styles |
| `css/settings.css` | Settings modal and header actions |

### Config Files

| File | Purpose |
|------|---------|
| `configs/default-dashboard.json` | Default widget layout, embedded as fallback in ConfigService |
| `configs/export-profiles.json` | Export presets (Executive Review, Monthly Ops, Vendor RCA, Reject Analysis) |

---

## Data Flow

```
Excel Upload
    ↓ (SheetJS)
APP.RAW, APP.REJECTIONS
    ↓
Filters (APP.apply)
    ↓
APP.DATA, APP.filteredRejections
    ↓
Chart/Table Rendering
    ↓ (on filter change)
Live Dashboard
    ↓ (Export)
PNG, PPT, Excel
```

---

## Key Concepts & Conventions

### State Management
- **Immutable updates:** Filters re-create `APP.DATA` and `APP.filteredRejections` (no mutation).
- **Single source of truth:** `APP.RAW` is never modified; all transformations derive from it.
- **Live sync:** Changing any filter immediately triggers `APP.apply()` → render cycle.

### Configuration-Driven Design
- **Widgets:** Each dashboard card is defined by a JSON config object with `id`, `type` (chart/table/kpi/summary), `dataset`, `section`, and layout.
- **Sections:** Dashboard divided into tabs (Overview, Analytics, Rejections, etc.); each section contains widgets.
- **Exportable:** Widgets can be marked `exportable: true` and grouped into export profiles.

### Utility Patterns
- **APP.g(id):** Shorthand for `document.getElementById(id)` — used everywhere.
- **APP.getValue(row, columnName):** Case-insensitive column lookup (handles `"Partner"`, `"PARTNER"`, etc.).
- **APP.escape(str):** HTML escape for security; prevents XSS in template rendering.
- **APP.u(array):** Unique values from array; used for filter dropdowns.

### Filter Logic
- **rejMonthMatches(), matchesFilter():** Check if a value passes the currently selected filter.
- **APP.apply():** Master filter function; rebuilds APP.DATA and APP.filteredRejections by checking all filter conditions.
- **onFilterChange callback:** Allows modules to respond when filters change.

### Chart & Export
- **Chart.js instances:** Stored in `APP.charts` keyed by chart ID.
- **Canvas-to-image:** html2canvas converts chart canvases to PNG for PPT/email.
- **PptxGenJS:** Generates PowerPoint directly; native charts and tables where possible.

---

## File Structure

```
/
├── index.html                    # HTML shell
├── js/
│   ├── app.js                   # Main controller (3649 lines)
│   ├── data.js                  # State store
│   ├── filters.js               # Filter logic
│   ├── charts.js                # Chart.js config
│   ├── views.js                 # Tab switching
│   ├── tab-manager.js           # Tab UI
│   ├── widget-renderer.js        # Widget rendering
│   ├── rejection-filter-bar.js   # Rejection filter accordion
│   └── runtime.js               # Startup & initialization
├── services/
│   ├── config-service.js         # Config persistence
│   ├── export-service.js         # Export orchestration
│   ├── pivot-engine.js           # Pivot aggregations
│   ├── cache-service.js          # Memoization
│   └── widget-registry.js        # Widget registry
├── css/
│   ├── style.css                # Global styles
│   ├── rejections.css           # Rejection tab styles
│   └── settings.css             # Settings modal styles
├── configs/
│   ├── default-dashboard.json    # Default widget config
│   └── export-profiles.json      # Export presets
└── docs/
    ├── guide/                    # User guides
    └── project-management/       # Development docs
```

---

## Common Tasks for AI Agents

### Adding a New Chart Widget
1. Add widget config to `configs/default-dashboard.json` with `id`, `dataset`, `type: "chart"`, `rows`, `values`, `topN`.
2. In `app.js`, add render call in appropriate section (e.g., `renderAnalyticsTables`).
3. Ensure `APP.DATA` or `APP.filteredRejections` is populated before render.
4. Test with sample Excel data.

### Fixing a Filter Issue
1. Check `filters.js`: verify `matchesFilter()` logic for the field.
2. Check `app.js` `APP.apply()`: ensure filter is included in the filter condition chain.
3. Verify Excel column name matches the filter field (use `APP.findColumnName()` for case-insensitive lookup).
4. Trace filter change: element `onchange` → `APP.apply()` → `APP.render()`.

### Adding a Settings Modal Feature
1. Add HTML modal in `index.html` with `id="<feature>Modal"`.
2. Add event listeners in `app.js` (look for `if (APP.g(...))` pattern).
3. Add CSS styling in appropriate `css/<section>.css` file.
4. Test modal show/hide logic and button click handlers.

### Debugging Export Issues
1. Check `APP.charts` to verify chart instances exist.
2. Check `app.js` `renderGlobalExportList()` for widget grouping.
3. Check `services/export-service.js` for canvas-to-image conversion and PPT generation.
4. Test with smaller dataset first.

---

## Known Limitations & Gotchas

| Issue | Context | Workaround |
|-------|---------|-----------|
| CORS on file:// | Direct HTML load fails `fetch()` | ConfigService now has bundled fallback + downloadable JSON |
| No framework | Everything is vanilla JS + jQuery-like utilities | Consistent with project design; avoid framework assumptions |
| Case-sensitive columns | Excel headers vary (MONTH vs Month) | Always use `APP.findColumnName()` for lookups |
| Large datasets (100k+ rows) | DOM rendering slows down | Use CacheService memoization; plan Tabulator integration for virtualization |
| Chart re-render timing | Race condition if render called before data ready | Use `APP.apply()` → `APP.render()` pattern; avoid manual chart updates |
| localStorage size | Limited to ~5-10MB per domain | Monitor config file size; consider compression if many widgets saved |

---

## Testing Approach

1. **Manual QA:** Load sample Excel files from `data/` folder; apply filters; verify chart updates.
2. **Excel sheets:** Project supports 4 sheet types (DATA, REJECTIONDATA, CONFIG, SUGGESTIONS, REROUTE, APN_VOLUME).
3. **Export testing:** Test PNG, PPT, Excel exports with various widget combinations.
4. **Browser console:** No build step; debug via `console.log()` and DevTools.

---

## Development Workflow

### Local Development
1. Open `index.html` directly in browser (http://localhost for server mode) or use Live Server VS Code extension.
2. Upload Excel workbook via file input or use Auto Load (if dev data in `data/` folder).
3. Make changes to `.js` or `.css`; reload browser tab (F5) to test.
4. Use browser DevTools Console for debugging.

### Git Workflow
- Branch: `feature/<feature-name>` for new features, `bugfix/<bug>` for fixes.
- Commits: Atomic, descriptive messages (e.g., "feat: add config import UI").
- PR: Describe changes, test results, and any breaking changes.

### Documentation
- Update `docs/task/plan.md` for task progress.
- Update `docs/project-management/implementation-status.md` for completed features.
- Update `docs/project-management/session-handoff.md` before handing off to another developer.

---

## Quick Reference: Key Global Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `APP.apply()` | `void` | Master filter; rebuilds APP.DATA and APP.filteredRejections |
| `APP.render()` | `void` | Triggers full dashboard render cycle |
| `APP.draw()` | `void` | Renders all charts in APP.charts |
| `APP.g(id)` | `Element` | Shorthand for `document.getElementById()` |
| `APP.getValue(row, col)` | `string` | Case-insensitive column value lookup |
| `APP.escape(str)` | `string` | HTML-escape string for safe rendering |
| `APP.u(array)` | `Array` | Unique values from array |
| `ConfigService.loadDashboardConfig()` | `Promise<Object>` | Load config from localStorage or bundled fallback |
| `ConfigService.saveDashboardConfig(config)` | `void` | Save config to localStorage and trigger JSON download |
| `PivotEngine.pivot(data, config)` | `Object` | Build pivot table aggregation |
| `ExportService.exportDirectPPT()` | `void` | Export selected widgets to PPT |

---

## AI Agent Guidance

### When Analyzing This Codebase
1. **State-first:** Always trace from APP.RAW → APP.DATA → rendering.
2. **Filter flow:** Understand that filters rebuild data; chart updates follow automatically.
3. **No framework:** Think in terms of vanilla JS patterns; avoid React/Vue assumptions.
4. **Config-driven:** Widgets are data; widget rendering is separate. Changing config doesn't require code changes.

### When Fixing Bugs
1. **Verify data:** Confirm APP.DATA has expected rows after filter applied.
2. **Check event binding:** Ensure event listeners are attached after DOM is ready.
3. **Test isolation:** Make minimal changes; test in browser immediately after each change.
4. **Check console:** Monitor for JS errors; break on error in DevTools.

### When Adding Features
1. **Check data flow:** Understand where new data/config enters the system.
2. **Update plan.md:** Document feature in plan before implementing.
3. **Add tests:** Manual testing via browser; document test steps.
4. **Update docs:** Add brief explanation to session-handoff.md.

---

## Contacts & Handoff

See `docs/project-management/session-handoff.md` for context from previous sessions.

