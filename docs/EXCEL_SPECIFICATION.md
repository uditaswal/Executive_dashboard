# Excel Workbook Structure - Exact Requirements

---

## Workbook Overview

Your Excel workbook must have the following sheets (exact case-sensitive names):

```
1. DATA           (Required - Core incident data)
2. CONFIG         (Optional - Dashboard settings)
3. SUGGESTIONS    (Optional - Executive recommendations)
4. REROUTE        (Optional - Transaction reroute metrics)
5. APN_VOLUME     (Optional - APN monthly volume trends)
```

---

## SHEET 1: DATA (REQUIRED)

**Purpose:** Core incident records. Required for dashboard to function.

### Required Columns (EXACT Names - Case Sensitive)

| Column Name | Data Type | Description | Example |
|-------------|-----------|-------------|---------|
| Incident | String | Unique incident ID | INC-001, INC-002 |
| Month | String | Month of incident | Jan, Feb, Mar (3-letter format) |
| Partner | String | Partner name | MFS, TerraPay, TransferTo |
| Receive Country | String | Receiving country | GH, KE, NG, CM |
| Issue (WU issue/Partner side) | String | Issue source | WU side, Partner side, Vendor |
| issue category | String | Main category | Funding, Technical, Network |
| Issue subcategory | String | Specific subcategory | Insufficient Funds, API Timeout |
| Status | String | Incident status | Open, Closed, Resolved, Monitoring |
| PRIORITY | Number | Priority level | 1, 2, 3, 4 |
| Impact type | String | Impact type | High, Medium, Low, Critical |
| Region | String | Geographic region | MEA, APAC, EMEA |
| Wallet Name/Specific Bank | String | Wallet/bank identifier | VODAFONE_GH, GTB_NG |
| Delayed Transaction | Number | Count of delayed transactions | 100, 250, 1500 |
| Delivery Breached | Number | Count of breached deliveries | 50, 120, 800 |
| Transaction Loss(customer impact) | Number | Lost transaction amount | 10000, 50000 |
| Transaction REJECTED | Number | Count of rejected transactions | 25, 75, 300 |
| Time Taken for Resolution | Number | Hours to resolve | 1, 2.5, 8, 24 |
| Monitoring Gap / delay In detection | String | Detection gap category | < 1 hour, 1-4 hours, > 4 hours |

### Filter Values (Use Consistent Values)

**Months:** Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec

**Status:** Open, Closed, Resolved, Monitoring

**PRIORITY:** 1, 2, 3, 4

**Impact type:** Critical, High, Medium, Low

**Region:** MEA, APAC, EMEA, LATAM

**Issue (WU issue/Partner side):** WU side, Partner side, Vendor

---

## SHEET 2: CONFIG (Optional)

**Purpose:** Dashboard customization and branding.

### Structure

| key | value |
|-----|-------|
| title | Payments Operations Dashboard |
| theme_color | #0f2d52 |

### Supported Keys

| Key | Value | Default | Example |
|-----|-------|---------|---------|
| title | Dashboard title text | Payments Dashboard | Payments Operations Dashboard |
| theme_color | Hex color code | #0f2d52 | #0f2d52 (navy blue) |

---

## SHEET 3: SUGGESTIONS (Optional)

**Purpose:** Executive recommendations displayed on Overview tab.

### Structure

| Suggestion |
|------------|
| Increase partner redundancy onboarding |
| Review delivery SLA escalation workflow |
| Consolidate wallet connectivity issues |

Simply add one suggestion per row. Leave empty if not needed.

---

## SHEET 4: REROUTE (Optional)

**Purpose:** Transaction rerouting metrics.

### Required Columns (EXACT Names - Case Sensitive)

| Column Name | Data Type | Description | Example |
|-------------|-----------|-------------|---------|
| TXN_COUNT | Number | Number of rerouted transactions | 100, 500, 1000 |
| SENDAMOUNTINUSD | Number | USD amount saved | 5000.50, 25000.00 |
| PREVIOUS_PARTNER | String | Original partner | MFS, TerraPay |
| CURRENT_PARTNER | String | Reroute destination | TransferTo, Remitly |
| RECEIVECOUNTRYCODE | String | Receiving country code | GH, NG, KE |
| STATUS | String | Reroute status | PROCESSED, PENDING, FAILED |

### Sample Data

| TXN_COUNT | SENDAMOUNTINUSD | PREVIOUS_PARTNER | CURRENT_PARTNER | RECEIVECOUNTRYCODE | STATUS |
|-----------|-----------------|------------------|-----------------|------------------|--------|
| 166 | 29286.87 | MFS | TERRAPAY | CM | PROCESSED |
| 245 | 51234.50 | AIRTEL | TRANSFERTO | GH | PROCESSED |
| 89 | 18900.25 | MTN | REMITLY | NG | PENDING |

### Metrics Generated

- **Total Rerouted Transactions:** Sum of TXN_COUNT
- **Total USD Saved:** Sum of SENDAMOUNTINUSD
- **Top Reroute Corridor:** Country with most reroutes
- **Top Reroute Partner Swap:** PREVIOUS_PARTNER → CURRENT_PARTNER

---

## SHEET 5: APN_VOLUME (Optional)

**Purpose:** Monthly APN transaction volume trends.

### Required Columns (EXACT Names - Case Sensitive)

| Column Name | Data Type | Description | Example |
|-------------|-----------|-------------|---------|
| CREATED_DATE | String | Month in MMM-YY format | Jan-26, Feb-26, Mar-26 |
| COUNT(*) | Number | Total APN transactions | 7094054, 7500000 |

### Sample Data

| CREATED_DATE | COUNT(*) |
|--------------|----------|
| Jan-26 | 7094054 |
| Feb-26 | 7234120 |
| Mar-26 | 7567890 |
| Apr-26 | 7823456 |
| May-26 | 8012345 |

### Metrics Generated

- **Total APN Volume:** Sum of all COUNT(*)
- **Average Monthly Volume:** Total / Number of months
- **Monthly Trend:** Visualization of volume over time

---

## Data Type Guidelines

- **String:** Text values (no leading/trailing spaces)
- **Number:** Numeric values (no currency symbols or commas)
- **Date:** Use format "Jan-26", "Feb-26" (3-letter month + 2-digit year)

---

## Validation Rules

### For DATA Sheet

- **Month:** Must be one of: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
- **PRIORITY:** Must be numeric: 1, 2, 3, or 4
- **Delayed Transaction:** Must be ≥ 0
- **Delivery Breached:** Must be ≥ 0
- **Transaction REJECTED:** Must be ≥ 0
- **Time Taken for Resolution:** Must be > 0
- **No leading/trailing spaces** in any column values

### For REROUTE Sheet

- **TXN_COUNT:** Must be ≥ 0
- **SENDAMOUNTINUSD:** Must be ≥ 0
- **STATUS:** Should be: PROCESSED, PENDING, or FAILED

### For APN_VOLUME Sheet

- **COUNT(*):** Must be > 0
- **CREATED_DATE:** Must be in MMM-YY format exactly

---

## Maximum Recommended Rows

- **DATA:** Up to 10,000 incidents
- **REROUTE:** Up to 1,000 transactions
- **APN_VOLUME:** 12-24 months
- **SUGGESTIONS:** 5-10 suggestions
- **CONFIG:** 5-10 settings

---

## Complete Example Workbook Structure

```
File: payments_incident_sample.xlsx

Sheet: DATA
├── Row 1: Column Headers
├── Row 2-N: Incident data rows
└── Min 1,500 sample rows recommended

Sheet: CONFIG
├── Row 1: Headers (key | value)
└── Row 2-N: Configuration settings

Sheet: SUGGESTIONS
├── Row 1: Header (Suggestion)
└── Row 2-N: Recommendation text

Sheet: REROUTE
├── Row 1: Headers (TXN_COUNT | SENDAMOUNTINUSD | ...)
└── Row 2-N: Reroute transaction data

Sheet: APN_VOLUME
├── Row 1: Headers (CREATED_DATE | COUNT(*))
└── Row 2-N: Monthly volume data
```

---

## How Dashboard Uses Each Sheet

| Sheet | Used By | Functionality |
|-------|---------|---------------|
| DATA | All charts, tables, filters | Core incident analytics |
| CONFIG | App initialization | Branding & dashboard title |
| SUGGESTIONS | Overview tab | Executive insights & recommendations |
| REROUTE | Metrics & charts | Transaction rerouting analytics |
| APN_VOLUME | APN chart & metrics | Monthly volume trends |

---

## Upload Instructions

1. Click "Workbook" file input in the left filter panel
2. Select your Excel file (`.xlsx` or `.xls` format)
3. Dashboard auto-loads all sheets
4. Filters populate from unique values in DATA sheet columns
5. All charts, tables, and metrics render from aggregated data
6. Existing data in memory persists (until refresh or new upload)

---

## Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| Filters are empty | DATA sheet not named "DATA" | Rename first sheet to exactly "DATA" |
| Charts don't show | Missing required columns in DATA | Verify all column names match exactly (case-sensitive) |
| Metrics show 0 | REROUTE/APN_VOLUME missing | Sheets are optional - add if needed or leave empty |
| Dashboard title not custom | CONFIG sheet missing | Add CONFIG sheet with title row |
| Date filtering doesn't work | Month values inconsistent | Use only: Jan, Feb, Mar... Dec format |
| Columns have extra spaces | Data imported with spaces | Clean data: remove leading/trailing spaces |
| Numbers show as text | Number columns formatted as text | Re-format column as Number in Excel |

---

## File Size Recommendations

- **File Size:** Keep under 10 MB
- **Rows:** Optimize for 1,000-5,000 DATA rows
- **Columns:** Only include columns listed above (extra columns OK but ignored)
- **Format:** Save as `.xlsx` (Excel 2007+ format) - not `.xls`

---

## Quick Checklist Before Upload

- [ ] DATA sheet exists with all required columns
- [ ] Column names match exactly (case-sensitive)
- [ ] Month values are: Jan, Feb, Mar... Dec
- [ ] PRIORITY values are: 1, 2, 3, 4
- [ ] No leading or trailing spaces in data
- [ ] Numeric columns contain only numbers (no $, commas)
- [ ] File is saved as .xlsx format
- [ ] File size is under 10 MB
- [ ] Optional sheets (CONFIG, REROUTE, APN_VOLUME) are properly named if included
- [ ] CONFIG sheet (if included) has "key" and "value" columns
