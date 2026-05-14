## High Priority

- Keep the legacy dashboard rendering stable and browser-test all existing graphs.
- Verify the current workbook mappings still behave correctly:
  - `APN_VOLUME` -> reroute-style metrics
  - `REROUTE` -> monthly volume metrics
  - `RejectionData` / `PayoutData` alias loading
- Finish safe legacy Rejections parity work:
  - add bank name filter
  - add bank code filter
  - add status filter
  - add additional rejection charts/tables from the target plan
- Browser-test legacy export and legacy chart rendering with the real workbook.

## Medium Priority

- Reintroduce the runtime/config architecture only in small slices if/when the live dashboard is stable.
- If runtime work resumes:
  - load it behind a controlled flag or isolated entrypoint
  - avoid overriding `APP.render` and `APP.parse` globally until parity is proven
- Move pivot builder into runtime/service ownership only after a safe migration plan is in place.
- Add config import/export UI and profile save/load UI.
- Add stronger widget-level compatibility checks using `schema` + `dataVersion`.

## Low Priority

- Re-enable Tabulator only when the Rejections section is migrated safely and browser-tested.
- Migrate parked runtime adapter widgets into native chart/table/summary renderers.
- Add richer widget layout controls using existing `layout.width`, `layout.height`, and `layout.order`.
- Add widget create/edit UX for runtime-generated widgets.
- Verify the functionality of new rejection filters (Bank Name, Bank Code, Status).
- Ensure UI integration for the new filters in the rejection tab.
