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

    APP.apply();
};

globalFilters.rejections = {
    month: [],
    partner: [],
    country: [],
    deliveryService: [],
    bankname: [],
    bankcode: [],
    status: []
};
