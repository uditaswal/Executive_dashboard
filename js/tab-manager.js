/**
 * Config-Driven Tab Manager
 * Manages dashboard tabs based on configuration
 * Supports dynamic tab creation, visibility, and export
 */

APP.TabManager = {
    /**
     * Default tabs configuration
     */
    defaultTabs: [
        {
            id: "overview",
            title: "Overview",
            icon: "Overview",
            visible: true,
            order: 1,
            exportable: true
        },
        {
            id: "pivot",
            title: "Pivot",
            icon: "Pivot",
            visible: true,
            order: 2,
            exportable: false
        },
        {
            id: "incidents-overview",
            title: "Incidents Overview",
            icon: "Incidents",
            visible: true,
            order: 3,
            exportable: true
        },
        {
            id: "rejections",
            title: "Rejections",
            icon: "Rejections",
            visible: true,
            order: 4,
            exportable: true
        },
        {
            id: "guide",
            title: "Guide",
            icon: "Guide",
            visible: true,
            order: 5,
            exportable: false
        }
    ],

    /**
     * Get tabs from config or use defaults
     */
    getTabs: function() {
        if (APP.CONFIG && APP.CONFIG.tabs) {
            return APP.CONFIG.tabs;
        }
        return this.defaultTabs;
    },

    /**
     * Get visible tabs
     */
    getVisibleTabs: function() {
        return this.getTabs().filter(tab => tab.visible);
    },

    /**
     * Get exportable tabs
     */
    getExportableTabs: function() {
        return this.getTabs().filter(tab => tab.exportable && tab.visible);
    },

    /**
     * Switch to a tab
     */
    switchTab: function(tabId) {
        APP.view(tabId);
    },

    /**
     * Get current active tab
     */
    getCurrentTab: function() {
        const active = document.querySelector(".tab.active");
        if (active && active.dataset.view) {
            return this.getTabs().find(tab => tab.id === active.dataset.view);
        }
        return null;
    },

    /**
     * Render tabs dynamically
     */
    renderTabs: function() {
        const tabsContainer = document.querySelector(".tabs");
        if (!tabsContainer) return;

        const tabs = this.getVisibleTabs()
            .sort((a, b) => a.order - b.order);

        const existingTabs = tabsContainer.querySelectorAll(".tab:not(.guide-tab)");
        existingTabs.forEach(tab => tab.remove());

        const guideTab = tabsContainer.querySelector(".guide-tab");
        tabs.forEach((tab, index) => {
            if (tab.id !== "guide") {
                const button = document.createElement("button");
                button.className = "tab";
                button.dataset.view = tab.id;
                button.textContent = tab.title;

                if (index === 0) {
                    button.classList.add("active");
                }

                button.onclick = (e) => {
                    e.preventDefault();
                    APP.view(tab.id);
                };

                if (guideTab) {
                    tabsContainer.insertBefore(button, guideTab);
                } else {
                    tabsContainer.appendChild(button);
                }
            }
        });
    }
};

/**
 * Direct PPT Export Module
 * Exports all visible content directly to PPT
 */
APP.PPTExporter = {
    /**
     * Export current view to PPT
     */
    exportDirectPPT: async function() {
        try {
            const pres = new PptxGenJS();
            pres.defineLayout({ name: "LAYOUT1", master: "MASTER1" });

            const titleSlide = pres.addSlide();
            titleSlide.background = { color: "0f2d52" };
            titleSlide.addText("Payments Dashboard Report", {
                x: 0.5,
                y: 2,
                w: 9,
                h: 1.5,
                fontSize: 44,
                bold: true,
                color: "FFFFFF",
                align: "center"
            });
            titleSlide.addText(new Date().toLocaleDateString(), {
                x: 0.5,
                y: 3.5,
                w: 9,
                h: 0.5,
                fontSize: 18,
                color: "CCCCCC",
                align: "center"
            });

            const tabs = APP.TabManager.getExportableTabs();
            for (const tab of tabs) {
                if (tab.id === "guide") continue;

                const content = this.getTabContent(tab.id);
                if (content) {
                    await this.addContentToPresentation(pres, tab, content);
                }
            }

            pres.writeFile({ fileName: `Dashboard_${new Date().toISOString().split("T")[0]}.pptx` });
        } catch (error) {
            console.error("PPT Export Error:", error);
            alert("Error exporting to PPT: " + error.message);
        }
    },

    /**
     * Get content from a tab
     */
    getTabContent: function(tabId) {
        if (tabId === "analytics" || tabId === "incidents") {
            tabId = "incidents-overview";
        }

        const tabElement = APP.g(tabId);
        if (!tabElement) return null;

        return {
            element: tabElement,
            html: tabElement.innerHTML,
            canvases: tabElement.querySelectorAll("canvas")
        };
    },

    /**
     * Add tab content to presentation
     */
    addContentToPresentation: async function(pres, tab, content) {
        const slide = pres.addSlide();

        slide.addText(tab.title, {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.5,
            fontSize: 24,
            bold: true,
            color: "0f2d52"
        });

        for (const canvas of content.canvases) {
            if (canvas.offsetParent !== null) {
                try {
                    const imgData = canvas.toDataURL("image/png");
                    slide.addImage({
                        data: imgData,
                        x: 0.5,
                        y: 1.2,
                        w: 9,
                        h: 4.5
                    });
                } catch (e) {
                    console.warn("Could not export canvas:", canvas.id);
                }
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    const tabsContainer = document.querySelector(".tabs");
    const hasStaticTabs =
        tabsContainer?.querySelector("[data-view='overview']");

    if (!hasStaticTabs) {
        APP.TabManager.renderTabs();
    }
});
