# Migration Status

## Current Decision

- Runtime migration is paused.
- The legacy dashboard remains the supported production implementation.

## What Stays Parked

- `js/runtime.js` as the primary shell
- Runtime-owned export wiring
- Runtime-owned filter rendering
- Runtime-owned section navigation

## What Is Safe To Reuse

- Isolated service helpers
- Data aggregation or export ideas that do not take over page ownership
- Config persistence helpers that work equally well in the legacy path

## Resume Criteria

- Legacy charts, filters, tables, pivot flow, and exports stay stable
- Runtime work is isolated behind a branch or explicit feature flag
- The migration has a decision-complete owner and test plan
