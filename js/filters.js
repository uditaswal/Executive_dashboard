/**
 * Filter Bar Controller — Manages multi-select dropdown filters for both incidents and rejections datasets.
 * Populates filter options from raw data, applies combined filter logic across all dimensions (Month, Partner, Status, etc.).
 * Drives real-time data re-aggregation and chart re-rendering when any filter selection changes.
 */

APP.fill = (id, vals) => {
    const e = APP.g(id),
        f = e.options[0].outerHTML;
    e.innerHTML = f;
    vals.forEach((v) => (e.innerHTML += `<option>${v}</option>`));
};

APP.filterValues = (id) => {
    const el = APP.g(id);

    if (!el) return [];

    return [...el.selectedOptions]
        .map(option => option.value)
        .filter(Boolean);
};

APP.copySelectOptions = (sourceId, targetId) => {
    const source = APP.g(sourceId);
    const target = APP.g(targetId);

    if (!source || !target) return;

    target.innerHTML = [...source.options]
        .filter((option) => option.value)
        .map((option) => `<option value="${APP.escape(option.value)}">${APP.escape(option.textContent)}</option>`)
        .join("");
};

APP.syncSelectSelection = (sourceId, targetId) => {
    const source = APP.g(sourceId);
    const target = APP.g(targetId);

    if (!source || !target) return;

    const selected =
        new Set([...source.selectedOptions].map((option) => option.value));

    [...target.options].forEach((option) => {
        option.selected =
            selected.has(option.value);
    });
};

APP.syncChartFilterMirrors = () => {
    [
        ["fMonth", "cfMonth"],
        ["fPartner", "cfPartner"],
        ["fStatus", "cfStatus"],
        ["fPriority", "cfPriority"],
        ["fRegion", "cfRegion"],
        ["fRejMonth", "rcfMonth"],
        ["fRejPartner", "rcfPartner"],
        ["fRejCountry", "rcfCountry"],
        ["fRejDelivery", "rcfDelivery"],
        ["fRejBankName", "rcfBankName"],
        ["fRejStatus", "rcfStatus"]
    ].forEach(([sourceId, targetId]) => {
        APP.copySelectOptions(sourceId, targetId);
        APP.syncSelectSelection(sourceId, targetId);
    });

    if (APP.g("cfSearch") && APP.g("search")) {
        APP.g("cfSearch").value = APP.g("search").value;
    }
};

APP.copyMirrorSelectionBack = (mirrorId, sourceId) => {
    const mirror = APP.g(mirrorId);
    const source = APP.g(sourceId);

    if (!mirror || !source) return;

    const selected =
        new Set([...mirror.selectedOptions].map((option) => option.value));

    [...source.options].forEach((option) => {
        option.selected =
            selected.has(option.value);
    });
};

APP.applyAnalyticsChartFilters = () => {
    [
        ["cfMonth", "fMonth"],
        ["cfPartner", "fPartner"],
        ["cfStatus", "fStatus"],
        ["cfPriority", "fPriority"],
        ["cfRegion", "fRegion"]
    ].forEach(([mirrorId, sourceId]) => {
        APP.copyMirrorSelectionBack(mirrorId, sourceId);
    });

    if (APP.g("search") && APP.g("cfSearch")) {
        APP.g("search").value = APP.g("cfSearch").value;
    }

    APP.apply();
};

APP.applyRejectionChartFilters = () => {
    [
        ["rcfMonth", "fRejMonth"],
        ["rcfPartner", "fRejPartner"],
        ["rcfCountry", "fRejCountry"],
        ["rcfDelivery", "fRejDelivery"],
        ["rcfBankName", "fRejBankName"],
        ["rcfStatus", "fRejStatus"]
    ].forEach(([mirrorId, sourceId]) => {
        APP.copyMirrorSelectionBack(mirrorId, sourceId);
    });

    APP.apply();
};

APP.matchesFilter = (id, value) => {
    const selected =
        APP.filterValues(id);

    return !selected.length ||
        selected.includes(String(value ?? ""));
};

APP.populate = () => {
    APP.fill("fMonth", APP.u(APP.RAW.map((x) => APP.getValue(x, "Month"))));
    APP.fill("fPartner", APP.u(APP.RAW.map((x) => APP.getValue(x, "Partner"))));
    APP.fill("fStatus", APP.u(APP.RAW.map((x) => APP.getValue(x, "Status"))));
    APP.fill("fPriority", APP.u(APP.RAW.map((x) => APP.getValue(x, "PRIORITY"))));
    APP.fill("fRegion", APP.u(APP.RAW.map((x) => APP.getValue(x, "Region"))));
    APP.fill("fCountry", APP.u(APP.RAW.map((x) => APP.getValue(x, "Receive Country"))));
    APP.fill("fOwner", APP.u(APP.RAW.map((x) => APP.issueOwner(x))));
    APP.fill("fCategory", APP.u(APP.RAW.map((x) => APP.value(x, ["Issue Category", "issue category", "Issue subcategory"]))));
    APP.fill("fImpact", APP.u(APP.RAW.map((x) => APP.getValue(x, "Impact type"))));
    
    // Populate rejection tab filters
    APP.fill("fRejMonth", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "MONTH"))));
    APP.fill("fRejPartner", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "PARTNERNAME"))));
    APP.fill("fRejCountry", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "RECEIVECOUNTRYCODE"))));
    APP.fill("fRejDelivery", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "DELIVERYSERVICE"))));
    APP.fill("fRejBankName", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "BANKNAME"))));
    APP.fill("fRejBankCode", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "BANKCODE"))));
    APP.fill("fRejStatus", APP.u(APP.REJECTIONS.map((x) => APP.getValue(x, "STATUS"))));

    if (typeof APP.syncRejectionFilterAccordion === "function") {
        APP.syncRejectionFilterAccordion();
    }

    APP.syncChartFilterMirrors?.();
};
APP.apply = () => {
    const q = APP.g("search").value.toLowerCase();
    const monthMatches = (value) =>
        APP.matchesFilter("fMonth", value);
    
    const rejMonthMatches = (value) =>
        APP.matchesFilter("fRejMonth", value);

    APP.DATA = APP.RAW.filter(
        (r) => {
            return (
                monthMatches(APP.getValue(r, "Month")) &&
                APP.matchesFilter("fPartner", APP.getValue(r, "Partner")) &&
                APP.matchesFilter("fStatus", APP.getValue(r, "Status")) &&
                APP.matchesFilter("fPriority", APP.getValue(r, "PRIORITY")) &&
                APP.matchesFilter("fRegion", APP.getValue(r, "Region")) &&
                APP.matchesFilter("fCountry", APP.getValue(r, "Receive Country")) &&
                APP.matchesFilter("fOwner", APP.issueOwner(r)) &&
                APP.matchesFilter("fCategory", APP.value(r, ["Issue Category", "issue category", "Issue subcategory"])) &&
                APP.matchesFilter("fImpact", APP.getValue(r, "Impact type")) &&
                (!q || JSON.stringify(r).toLowerCase().includes(q))
            );
        }
    );

    APP.filteredRejections =
        APP.REJECTIONS.filter((r) => (
            rejMonthMatches(APP.getValue(r, "MONTH")) &&
            APP.matchesFilter("fRejPartner", APP.getValue(r, "PARTNERNAME")) &&
            APP.matchesFilter("fRejCountry", APP.getValue(r, "RECEIVECOUNTRYCODE")) &&
            APP.matchesFilter("fRejDelivery", APP.getValue(r, "DELIVERYSERVICE")) &&
            APP.matchesFilter("fRejBankName", APP.getValue(r, "BANKNAME")) &&
            APP.matchesFilter("fRejBankCode", APP.getValue(r, "BANKCODE")) &&
            APP.matchesFilter("fRejStatus", APP.getValue(r, "STATUS")) &&
            (!q || JSON.stringify(r).toLowerCase().includes(q))
        ));

    APP.render();
    APP.syncChartFilterMirrors?.();
};
APP.reset = () => {
    ["fMonth", "fPartner", "fStatus", "fPriority", "fRegion", "fCountry", "fOwner", "fCategory", "fImpact", "fRejMonth", "fRejPartner", "fRejCountry", "fRejDelivery", "fRejBankName", "fRejBankCode", "fRejStatus"].forEach(
        (x) => {
            const el = APP.g(x);

            if (el) {
                [...el.options].forEach(option => option.selected = false);
            }
        },
    );

    if (APP.g("search")) {
        APP.g("search").value = "";
    }

    if (APP.g("analyticsTopN")) {
        APP.g("analyticsTopN").value = "";
    }

    if (APP.g("rejectionsTopN")) {
        APP.g("rejectionsTopN").value = "";
    }

    APP.analyticsTopN = null;
    APP.rejectionsTopN = null;

    if (typeof APP.syncRejectionFilterAccordion === "function") {
        APP.syncRejectionFilterAccordion();
    }

    APP.apply();
    APP.syncChartFilterMirrors?.();

    if (typeof APP.notifyRejectionFilterChange === "function") {
        APP.notifyRejectionFilterChange();
    }
};

APP.resetRejectionFilters = () => {
    ["fRejMonth", "fRejPartner", "fRejCountry", "fRejDelivery", "fRejBankName", "fRejBankCode", "fRejStatus"].forEach(
        (id) => {
            const el = APP.g(id);

            if (el) {
                [...el.options].forEach((option) => option.selected = false);
            }
        },
    );

    if (typeof APP.syncRejectionFilterAccordion === "function") {
        APP.syncRejectionFilterAccordion();
    }

    APP.apply();
    APP.syncChartFilterMirrors?.();

    if (typeof APP.notifyRejectionFilterChange === "function") {
        APP.notifyRejectionFilterChange();
    }
};

APP.globalFilters = APP.globalFilters || {};
APP.globalFilters.rejections = APP.globalFilters.rejections || {
    month: [],
    partner: [],
    country: [],
    deliveryService: [],
    bankName: [],
    bankCode: [],
    status: []
};
