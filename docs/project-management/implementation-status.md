# Implementation Status

## Active Path

- Production shell: legacy dashboard in `index.html` with `js/app.js`, `js/data.js`, `js/filters.js`, and `js/charts.js`
- Parked WIP: `js/runtime.js`

## Done

- Merged the visible `Analytics` and `Incidents` tabs into a single `Incidents Overview` workspace
- Added persistent collapsible section controls across Overview, Incidents Overview, and Rejections
- Replaced the sidebar raw record text with incident/rejection stat pills
- Removed the `Auto Load` button while keeping startup sample-load behavior
- Rewired the chart label toggle to redraw the live chart registry
- Added developer-facing guide/README notes for the live workspace structure
- Fixed the `globalFilters` startup regression
- Kept runtime migration code out of the live HTML shell
- Added clean `file://` handling for sample workbook autoload
- Added collapsible filter sidebar behavior
- Merged graph-data tables into the Incident workspace
- Added shared table controls for Incident workspace table mode and pivot table output
- Added a visible rejection register with selected-column support and paging
- Added pivot-save deduplication and compact saved-widget UX
- Wired settings modal import/export/reset actions
- Added normalized workbook download
- Wired legacy export modal actions with broader native-first PPT behavior, including expanded builder bundle handling
- Added bundled export defaults with `Base Profile` and `Base Preset`
- Aligned the Guide, Excel specification, README, and project-management docs with the live WU workbook contract

## Still Open

- Browser validation of the refreshed guide and filter/export styling
- Decide later whether any skipped `docs/task/plan.md` phases should be revived against the live shell
- Deeper native PPT chart coverage
- Optional chart-level include/exclude and Bottom N controls if product wants parity with table mode
- Large-table virtualization only if live workbook sizes require it
- Any future runtime migration work
