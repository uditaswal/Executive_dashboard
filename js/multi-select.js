/**
 * Accessible multi-select enhancer for sidebar filter selects.
 * Keeps the original <select multiple> as the source of truth.
 */

(function () {
    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    class MultiSelect {
        constructor(selectEl) {
            this.select = selectEl;
            this.wrapper = null;
            this.trigger = null;
            this.dropdown = null;
            this.searchInput = null;
            this.boundDocumentClick = this.handleDocumentClick.bind(this);
            this.build();
        }

        build() {
            this.select.classList.add("multi-select-source");
            this.select.setAttribute("tabindex", "-1");
            this.select.setAttribute("aria-hidden", "true");

            this.wrapper = document.createElement("div");
            this.wrapper.className = "multi-select";
            this.wrapper.dataset.sourceId = this.select.id;

            this.trigger = document.createElement("button");
            this.trigger.type = "button";
            this.trigger.className = "multi-select-trigger";
            this.trigger.setAttribute("aria-expanded", "false");
            this.trigger.setAttribute("aria-haspopup", "listbox");

            this.dropdown = document.createElement("div");
            this.dropdown.className = "multi-select-dropdown hide";
            this.dropdown.innerHTML = `
<div class="multi-select-search-wrap">
    <input type="text" class="multi-select-search" placeholder="Search options">
</div>
<div class="multi-select-options" role="listbox" aria-multiselectable="true"></div>
`;

            this.searchInput = this.dropdown.querySelector(".multi-select-search");

            this.select.insertAdjacentElement("afterend", this.wrapper);
            this.wrapper.appendChild(this.trigger);
            this.wrapper.appendChild(this.dropdown);

            this.trigger.addEventListener("click", () => {
                this.toggle();
            });
            this.trigger.addEventListener("keydown", (event) => {
                if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    this.open();
                }
            });
            this.searchInput.addEventListener("input", () => {
                this.renderOptions(this.searchInput.value);
            });
            this.dropdown.addEventListener("click", (event) => {
                const optionButton = event.target.closest("[data-value]");
                const removeButton = event.target.closest("[data-remove-value]");

                if (removeButton) {
                    event.preventDefault();
                    this.toggleValue(removeButton.dataset.removeValue);
                    return;
                }

                if (optionButton) {
                    event.preventDefault();
                    this.toggleValue(optionButton.dataset.value);
                }
            });
            this.select.addEventListener("change", () => {
                this.render();
            });

            document.addEventListener("click", this.boundDocumentClick);
            this.render();
        }

        handleDocumentClick(event) {
            if (!this.wrapper?.contains(event.target)) {
                this.close();
            }
        }

        getSelectedValues() {
            return [...this.select.selectedOptions]
                .map((option) => option.value)
                .filter(Boolean);
        }

        toggleValue(value) {
            [...this.select.options].forEach((option) => {
                if (option.value === value) {
                    option.selected = !option.selected;
                }
            });

            this.select.dispatchEvent(new Event("change", { bubbles: true }));
            this.render();
        }

        open() {
            this.wrapper.classList.add("is-open");
            this.dropdown.classList.remove("hide");
            this.trigger.setAttribute("aria-expanded", "true");
            this.renderOptions("");
            this.searchInput.value = "";
            this.searchInput.focus();
        }

        close() {
            this.wrapper.classList.remove("is-open");
            this.dropdown.classList.add("hide");
            this.trigger.setAttribute("aria-expanded", "false");
        }

        toggle() {
            if (this.wrapper.classList.contains("is-open")) {
                this.close();
            } else {
                this.open();
            }
        }

        render() {
            const selected = this.getSelectedValues();
            const chips = selected.length
                ? selected.map((value) => `
<span class="multi-select-chip">
    ${escapeHtml(value)}
    <span class="multi-select-chip-remove" data-remove-value="${escapeHtml(value)}" aria-hidden="true">×</span>
</span>`).join("")
                : `<span class="multi-select-placeholder">All</span>`;

            this.trigger.innerHTML = `
<span class="multi-select-chip-wrap">${chips}</span>
<span class="multi-select-caret" aria-hidden="true">▾</span>
`;
            this.renderOptions(this.searchInput?.value || "");
        }

        renderOptions(query) {
            const list = this.dropdown?.querySelector(".multi-select-options");
            if (!list) return;

            const selected = new Set(this.getSelectedValues());
            const normalizedQuery = String(query || "").trim().toLowerCase();
            const options = [...this.select.options].filter((option) => option.value);
            const filtered = options.filter((option) =>
                !normalizedQuery || option.textContent.toLowerCase().includes(normalizedQuery)
            );

            list.innerHTML = filtered.length
                ? filtered.map((option) => `
<button type="button" class="multi-select-option${selected.has(option.value) ? " is-selected" : ""}" data-value="${escapeHtml(option.value)}">
    <span>${escapeHtml(option.textContent)}</span>
    <span class="multi-select-option-check" aria-hidden="true">${selected.has(option.value) ? "✓" : ""}</span>
</button>`).join("")
                : `<div class="multi-select-empty">No matching options</div>`;
        }
    }

    APP.initMultiSelects = () => {
        document.querySelectorAll("select.js-enhance-select[multiple]").forEach((select) => {
            if (select.dataset.multiSelectReady === "1") {
                const instance = select._multiSelectInstance;
                instance?.render();
                return;
            }

            select.dataset.multiSelectReady = "1";
            select._multiSelectInstance = new MultiSelect(select);
        });
    };
})();
