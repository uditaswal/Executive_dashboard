# Excel Workbook Structure - Current Dashboard Requirements

## Workbook Overview

The dashboard currently reads up to five workbook sheets:

```text
DATA         Required
CONFIG       Optional
SUGGESTIONS  Optional
REROUTE      Optional
APN_VOLUME   Optional
```

Notes:

- `DATA` is the primary incident sheet.
- If `DATA` is missing, the first worksheet is used as the incident dataset.
- `CONFIG` and `Config` are both accepted.
- `REROUTE` and `APN_VOLUME` may be matched by required columns even if sheet names differ.
- Sheet names are normalized before comparison, so minor casing, spacing, and punctuation differences are tolerated.

## Normalized Matching

The dashboard now normalizes both sheet names and column names before checking them.

Normalization currently:

- trims whitespace
- removes Excel `_x000d_` artifacts
- lowercases text
- removes spaces and punctuation for matching

Practical effect:

- `CONFIG`, `Config`, and `config` can all match the same logical sheet
- `Issue Category`, `issue category`, and similar punctuated variants can resolve to the same field
- optional sheets such as `REROUTE` and `APN_VOLUME` can still be discovered by their required columns even if the sheet tab name varies

## DATA Sheet

Purpose: incident analytics, filters, overview metrics, charts, RCA tables, and incident register rows.

### Core Columns Used By The Current UI

| Column Name                           | Usage                                        |
| ------------------------------------- | -------------------------------------------- |
| `Incident`                            | Incident register and search                 |
| `Month`                               | Filters, trend charts, period label          |
| `Partner`                             | Filters, rankings, RCA tables                |
| `Status`                              | Filters, KPI counts, status chart            |
| `PRIORITY`                            | Filters, KPI summaries, priority chart/cards |
| `Region`                              | Filters and regional overview insights       |
| `Receive Country`                     | Filters, country charts, RCA tables          |
| `Impact type`                         | Filters, incident stats, impact chart        |
| `Delayed Transaction`                 | KPI totals, impact charts, RCA tables        |
| `Delivery Breached`                   | KPI totals, impact charts, RCA tables        |
| `Transaction Loss(customer impact)`   | Loss chart and impact totals                 |
| `Transaction REJECTED`                | Rejection chart and impact totals            |
| `Time Taken for Resolution`           | Resolution breakdowns and chart              |
| `Monitoring Gap / delay In detection` | Monitoring chart and table                   |

### Ownership And RCA Columns

The app supports multiple naming styles for ownership and RCA logic:

| Column Name                     | Notes                                                   |
| ------------------------------- | ------------------------------------------------------- |
| `Issue(WU/Partner)`             | Preferred owner/source column                           |
| `Issue (WU issue/Partner side)` | Supported alias for owner/source                        |
| `Issue Category`                | Supported RCA category column                           |
| `issue category`                | Supported alias used in existing workbooks              |
| `Issue subcategory`             | Used in category trends and insufficient-funds analysis |
| `Issue Type`                    | Used in vendor RCA narrative aggregation                |
| `Issue type`                    | Supported alias for vendor RCA                          |
| `Platform`                      | Used in platform RCA grouping                           |
| `platform`                      | Supported alias for platform RCA                        |
| `RCA description`               | Platform RCA summary text                               |
| `Actual RCA`                    | Preferred RCA text when present                         |
| `Issue Summary`                 | Supported summary alias                                 |
| `Issue summary`                 | Supported summary alias                                 |
| `Prevention`                    | Platform RCA prevention text                            |
| `prevention`                    | Supported alias                                         |

### Additional Operational Columns

| Column Name                 | Usage                                  |
| --------------------------- | -------------------------------------- |
| `Wallet Name/Specific Bank` | Wallet trend and delayed-wallet charts |

### Recommended DATA Values

Use consistent values so filters and grouping remain clean:

- `Month`: `Jan` to `Dec`
- `Status`: values such as `Open`, `Closed`, `Resolved`, `Monitoring`
- `PRIORITY`: `1`, `2`, `3`, `4`
- `Impact type`: keep naming consistent, especially if using `Major`
- `Issue(WU/Partner)`: values like `WU issue` and `Vendor issue`
- `Issue Category`: values like `WU Side` and `Partner Side`

## Ownership Logic Used By The App

The `Issue Owner` filter shown in the sidebar is derived from:

- `Issue(WU/Partner)`, or
- `Issue (WU issue/Partner side)`

Normalization rules:

- values containing `wu` become `WU side`
- values containing `vendor` or `partner` become `Partner side`
- other non-empty values are kept as-is

## Overview RCA Logic

### Platform RCA

Platform RCA includes rows considered WU/internal, based on:

- `Issue(WU/Partner)` or alias containing `wu` or `internal`
- `Issue Category` or alias equal to `WU Side`
- normalized owner equal to `WU side`

Rows are grouped by `Platform` or `platform`, then summarized with:

- unique receive countries
- delayed transaction total
- breached transaction total
- combined RCA text
- combined prevention text

The UI shows the top five platforms by delayed transactions.

### Vendor Issues

Vendor Issues includes rows where both conditions are true:

- `Issue Category` or alias equals `Partner Side`
- `Issue(WU/Partner)` or alias equals `Vendor issue`

Rows are grouped by `Partner` and summarized with:

- country list
- incident count
- delayed and breached totals
- RCA narrative built from `Issue Type`, `Issue type`, or `Issue subcategory`

The UI shows the top five vendor partners.

## REROUTE Sheet

Purpose: reroute metrics shown in overview insights and supporting exports.

### Required Columns

```text
TXN_COUNT
SENDAMOUNTINUSD
```

### Additional Expected Columns

These are supported by the current sample format and should be kept when available:

```text
PREVIOUS_PARTNER
CURRENT_PARTNER
RECEIVECOUNTRYCODE
STATUS
```

Current dashboard calculations from this sheet:

- total rerouted transactions
- total USD value rerouted or saved

## APN_VOLUME Sheet

Purpose: APN monthly transaction volume chart and table.

### Required Columns

```text
CREATED_DATE
COUNT(*)
```

Expected format:

- `CREATED_DATE`: month label such as `Jan-26`
- `COUNT(*)`: numeric transaction volume

Current dashboard calculations from this sheet:

- bar chart of monthly APN volume
- average monthly volume metric for internal use
- total APN volume metric for internal use

## SUGGESTIONS Sheet

Purpose: recommendation list in the `Overview` tab.

Current expected columns:

```text
priority
suggestion
```

Behavior:

- rows are sorted by numeric `priority`
- non-empty `suggestion` values are rendered as list items

## CONFIG Sheet

Purpose: dashboard branding and basic theming.

Required structure:

```text
key
value
```

Supported keys:

```text
title
theme_color
```

Behavior:

- `title` updates the page heading
- `theme_color` updates the CSS `--primary` variable

## Validation Guidance

Recommended checks before upload:

- keep column names exact where possible
- avoid leading or trailing spaces in headers and values
- keep numeric columns numeric
- keep month values consistent with `Jan` to `Dec` for the `DATA` sheet
- use the same ownership/category wording throughout the workbook

## Current Dashboard Caveat

The app is more tolerant than before because matching is normalized, but it is still not fully schema-driven. Very different business labels can still fall outside the supported aliases and therefore drop out of charts, overview tables, filters, or pivot results.
