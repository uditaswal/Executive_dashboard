# Dashboard Implementation Summary

## Last Updated

May 18, 2026

## Current Live Shape

- Production path remains the legacy shell: `index.html` + `js/app.js`
- Live tabs are `Overview`, `Incident`, `Rejections`, and `Guide`
- Incident charts, graph-data tables, and incident pivots now share one workspace
- Rejection-specific filters stay inside the `Rejections` tab
- Export uses the modal flow with profile/preset-driven selection
- Guide and workbook docs describe the WU workbook contract first; sample autoload is optional convenience behavior

## Completed Product Work

### Filtering and Navigation

- Incident filters remain in the left sidebar and can be collapsed/reopened
- Rejection filters were moved out of the sidebar and into the `Rejections` tab
- Rejection accordion filters sync back to the existing filter engine and continue to drive `APP.filteredRejections`

### Incident Workspace

- Graph-data tables were merged into the Incident workspace
- Incident workspace now supports `Charts`, `Tables`, and `Pivot` modes
- Table-mode cards share Top N / Bottom N, sort, label filter, and exclusion controls
- Pivot saves are deduplicated by pivot definition before being written to dashboard config

### Export and Settings

- Export modal supports grouped selection, profile selection, saved presets, and custom preset save
- Bundled defaults now include `Base Profile` and `Base Preset`
- Native-first PPT export remains the preferred export path, with image fallback where needed
- Settings supports dashboard config/profile download, import, reset, and normalized workbook download

### Workbook and Guide Alignment

- Guide page no longer centers the localhost/sample-workbook path
- Guide and workbook docs were aligned to the live parser behavior in `js/data.js`
- Month normalization guidance now matches actual behavior, including year preservation such as `Jan-26 -> Jan 2026`
- Support-sheet guidance now explicitly covers `REROUTE`, `APN_VOLUME`, `SUGGESTIONS`, and `CONFIG`

## Validation Notes

- Localhost smoke check succeeded for `http://127.0.0.1:8000/index.html`
- Bundled sample workbook currently contains:
  - `DATA`
  - `RejectionData`
  - `APN_VOLUME`
  - `SUGGESTIONS`
  - `REROUTE`
  - `CONFIG`
- Sample workbook headers still include `_x000D_` artifacts in some sheets, which is expected and handled by the current normalization logic

## Important Files

- `index.html`
- `js/app.js`
- `js/data.js`
- `js/filters.js`
- `js/rejection-filter-bar.js`
- `services/config-service.js`
- `configs/export-profiles.json`

## Open Follow-Up

- Browser-level visual validation should still be completed for the refreshed filter styling, Guide page, and export modal defaults
- If the WU workbook contract changes further, docs should continue to follow the live parser until a stricter schema/versioning model is introduced
