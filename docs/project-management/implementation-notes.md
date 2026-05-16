# Implementation Notes

- Use the legacy page flow as the source of truth for all live fixes.
- Do not re-enable `js/runtime.js` from `index.html` during stabilization work.
- `services/config-service.js` is live for config/profile persistence and backup workflows.
- Runtime-oriented modules can be reused as helpers, but they should not silently become the page owner.
- When debugging local asset failures, distinguish between:
  - real broken relative paths
  - expected `ERR_CONNECTION_REFUSED` from a dev server that is not running
  - expected `file://` fetch limitations
