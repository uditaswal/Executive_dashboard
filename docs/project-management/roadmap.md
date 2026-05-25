# Roadmap

## High Priority

- Keep the legacy dashboard rendering stable and browser-test all existing graphs.
- Browser-test the new `Incidents Overview` merged workspace and collapsible sections with the real workbook.
- Verify the current workbook mappings still behave correctly:
  - `APN_VOLUME` -> reroute-style metrics
  - `REROUTE` -> monthly volume metrics
  - `RejectionData` / `PayoutData` alias loading
- Keep the Guide and workbook docs aligned with the live parser if the WU workbook contract evolves further.
- Browser-test legacy export and legacy chart rendering with the real workbook.

## Medium Priority

- Review the skipped phases in `docs/task/plan.md` and only revive them if they still fit the live shell.
- Reintroduce the runtime/config architecture only in small slices if/when the live dashboard is stable.
- If runtime work resumes:
  - Load it behind a controlled flag or isolated entrypoint
  - Avoid overriding `APP.render` and `APP.parse` globally until parity is proven
- Move pivot builder into runtime/service ownership only after a safe migration plan is in place.
- Add stronger widget-level compatibility checks using `schema` + `dataVersion`.

## Low Priority

- Re-enable Tabulator only when the Rejections section is migrated safely and browser-tested.
- Migrate parked runtime adapter widgets into native chart/table/summary renderers.
- Add richer widget layout controls using existing `layout.width`, `layout.height`, and `layout.order`.
- Add widget create/edit UX for runtime-generated widgets.
- Verify the functionality of rejection accordion filters (multi-select, Clear, Reset all, `APP.onRejectionFilterChange`).
