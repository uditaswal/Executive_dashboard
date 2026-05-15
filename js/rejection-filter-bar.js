/**
 * Rejection-Specific Filter UI — Builds accordion-style filter controls for the Rejections tab with multi-select dropdowns.
 * Maps rejection-specific fields (Month, Partner, Bank, Status, etc.) to filter state and propagates changes to rejection data aggregation.
 * Handles accordion expand/collapse, filter synchronization, and integration with rejection chart rendering.
 */

(function () {
    const REJ_FILTER_DEFS = [
        { selectId: "fRejMonth", label: "Month" },
        { selectId: "fRejPartner", label: "Partner" },
        { selectId: "fRejDelivery", label: "Delivery Service" },
        { selectId: "fRejBankName", label: "Bank Name" },
        { selectId: "fRejBankCode", label: "Bank Code" },
        { selectId: "fRejCountry", label: "Country" },
        { selectId: "fRejStatus", label: "Status" }
    ];

    let mountEl = null;

    function esc(s) {
        return String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;");
    }

    function selectedNonEmptyValues(selectId) {
        const el = APP.g(selectId);
        if (!el) {
            return [];
        }

        return [...el.selectedOptions]
            .map((o) => o.value)
            .filter(Boolean);
    }

    function summaryFor(selectId) {
        const n = selectedNonEmptyValues(selectId).length;

        return n === 0 ? "All" : `${n} selected`;
    }

    function setSelectFromValues(selectId, values) {
        const el = APP.g(selectId);
        if (!el) {
            return;
        }

        const set = new Set(values.map(String));

        [...el.options].forEach((opt) => {
            if (!opt.value) {
                opt.selected = false;
            } else {
                opt.selected = set.has(opt.value);
            }
        });
    }

    function selectAllForDimension(selectId) {
        setSelectFromValues(selectId, []);
    }

    APP.getRejectionFilterState = function () {
        return {
            month: selectedNonEmptyValues("fRejMonth"),
            partner: selectedNonEmptyValues("fRejPartner"),
            deliveryService: selectedNonEmptyValues("fRejDelivery"),
            bankName: selectedNonEmptyValues("fRejBankName"),
            bankCode: selectedNonEmptyValues("fRejBankCode"),
            country: selectedNonEmptyValues("fRejCountry"),
            status: selectedNonEmptyValues("fRejStatus")
        };
    };

    APP.onRejectionFilterChange = null;

    APP.notifyRejectionFilterChange = function () {
        if (typeof APP.onRejectionFilterChange === "function") {
            APP.onRejectionFilterChange(APP.getRejectionFilterState());
        }
    };

    function applyFromRejectionUi() {
        APP.apply();
        APP.notifyRejectionFilterChange();
    }

    function refreshAccordionsFromSelects() {
        if (!mountEl) {
            return;
        }

        REJ_FILTER_DEFS.forEach((def) => {
            const acc = mountEl.querySelector(
                `.rej-acc[data-select-id="${def.selectId}"]`
            );
            if (!acc) {
                return;
            }

            const sum = acc.querySelector(".rej-acc__summary");
            if (sum) {
                sum.textContent = summaryFor(def.selectId);
            }

            const vals = new Set(selectedNonEmptyValues(def.selectId));
            const allBox = acc.querySelector(".rej-filter-all");
            if (allBox) {
                allBox.checked = vals.size === 0;
            }

            acc.querySelectorAll(".rej-filter-value").forEach((cb) => {
                cb.checked = vals.has(cb.value);
            });
        });
    }

    function renderOneAccordion(def) {
        const select = APP.g(def.selectId);
        if (!select) {
            return "";
        }

        const accId = `rej-acc-${def.selectId}`;
        const vals = selectedNonEmptyValues(def.selectId);
        const allActive = vals.length === 0;
        const valueOptions = [...select.options].filter((o) => o.value);

        const valueRows = valueOptions
            .map((opt) => {
                const checked = opt.selected ? " checked" : "";

                return (
                    `<label class="rej-filter-option">` +
                    `<input type="checkbox" class="rej-filter-value" ` +
                    `data-select-id="${esc(def.selectId)}" ` +
                    `value="${esc(opt.value)}"${checked}>` +
                    `<span class="rej-filter-option-text">${esc(opt.textContent)}</span>` +
                    `</label>`
                );
            })
            .join("");

        return (
            `<div class="rej-acc" data-select-id="${esc(def.selectId)}">` +
            `<button type="button" class="rej-acc__trigger" aria-expanded="false" ` +
            `aria-controls="${accId}" id="${accId}-label">` +
            `<span class="rej-acc__title">${esc(def.label)}</span>` +
            `<span class="rej-acc__summary">${esc(summaryFor(def.selectId))}</span>` +
            `<span class="rej-acc__chevron" aria-hidden="true"></span>` +
            `</button>` +
            `<div class="rej-acc__panel hide" id="${accId}" role="region" ` +
            `aria-labelledby="${accId}-label">` +
            `<div class="rej-acc__panel-inner">` +
            `<label class="rej-filter-option rej-filter-option--all">` +
            `<input type="checkbox" class="rej-filter-all" data-select-id="${esc(def.selectId)}"` +
            (allActive ? " checked" : "") + ">" +
            `<span class="rej-filter-option-text">All</span>` +
            `</label>` +
            `<div class="rej-filter-values">${valueRows}</div>` +
            `<div class="rej-acc__footer">` +
            `<button type="button" class="rej-filter-clear" data-select-id="${esc(def.selectId)}">Clear</button>` +
            `</div>` +
            `</div></div></div>`
        );
    }

    APP.syncRejectionFilterAccordion = function () {
        mountEl = document.getElementById("rejectionAccordionMount");
        if (!mountEl) {
            return;
        }

        mountEl.innerHTML = REJ_FILTER_DEFS.map(renderOneAccordion).join("");
    };

    function togglePanel(trigger) {
        const acc = trigger.closest(".rej-acc");
        if (!acc) {
            return;
        }

        const panel = acc.querySelector(".rej-acc__panel");
        if (!panel) {
            return;
        }

        const willOpen = panel.classList.contains("hide");
        panel.classList.toggle("hide", !willOpen);
        trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
        acc.classList.toggle("rej-acc--open", willOpen);
    }

    function wireMount() {
        mountEl = document.getElementById("rejectionAccordionMount");
        if (!mountEl || mountEl.dataset.wired === "1") {
            return;
        }

        mountEl.dataset.wired = "1";

        mountEl.addEventListener("click", (e) => {
            const trigger = e.target.closest(".rej-acc__trigger");
            if (trigger && mountEl.contains(trigger)) {
                e.preventDefault();
                togglePanel(trigger);

                return;
            }

            const clearBtn = e.target.closest(".rej-filter-clear");
            if (clearBtn && mountEl.contains(clearBtn)) {
                const sid = clearBtn.getAttribute("data-select-id");
                selectAllForDimension(sid);
                refreshAccordionsFromSelects();
                applyFromRejectionUi();
            }
        });

        mountEl.addEventListener("change", (e) => {
            const t = e.target;
            if (!mountEl.contains(t)) {
                return;
            }

            const sid = t.getAttribute("data-select-id");
            if (!sid) {
                return;
            }

            if (t.classList.contains("rej-filter-all")) {
                if (!t.checked) {
                    const acc = t.closest(".rej-acc");
                    const hasVal =
                        acc &&
                        acc.querySelector(".rej-filter-value:checked");
                    if (!hasVal) {
                        t.checked = true;

                        return;
                    }
                } else {
                    selectAllForDimension(sid);
                }

                refreshAccordionsFromSelects();
                applyFromRejectionUi();

                return;
            }

            if (t.classList.contains("rej-filter-value")) {
                const acc = t.closest(".rej-acc");
                const checkedVals = acc
                    ? [...acc.querySelectorAll(".rej-filter-value:checked")].map(
                        (x) => x.value
                    )
                    : [];

                if (checkedVals.length === 0) {
                    selectAllForDimension(sid);
                } else {
                    setSelectFromValues(sid, checkedVals);
                }

                refreshAccordionsFromSelects();
                applyFromRejectionUi();
            }
        });
    }

    const resetBtn = document.getElementById("btnRejFiltersResetAll");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (typeof APP.resetRejectionFilters === "function") {
                APP.resetRejectionFilters();
            }
        });
    }

    wireMount();
    APP.syncRejectionFilterAccordion();
})();
