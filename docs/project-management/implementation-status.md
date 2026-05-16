# Implementation Status

## Active Path

- Production shell: legacy dashboard in `index.html` with `js/app.js`, `js/data.js`, `js/filters.js`, and `js/charts.js`
- Parked WIP: `js/runtime.js`

## Done

- Fixed the `globalFilters` startup regression
- Kept runtime migration code out of the live HTML shell
- Added clean `file://` handling for sample workbook autoload
- Added collapsible filter sidebar behavior
- Merged graph-data tables into the `Analytics` tab
- Added shared table controls for Analytics table mode and pivot table output
- Added a visible rejection register with selected-column support and paging
- Added pivot-save deduplication and compact saved-widget UX
- Wired settings modal import/export/reset actions
- Added normalized workbook download
- Wired legacy export modal actions with broader native-first PPT behavior, including expanded builder bundle handling

## Still Open

- Deeper native PPT chart coverage
- Optional chart-level include/exclude and Bottom N controls if product wants parity with table mode
- Large-table virtualization only if live workbook sizes require it
- Any future runtime migration work
