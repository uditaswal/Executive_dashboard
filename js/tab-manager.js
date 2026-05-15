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
            icon: "📊",
            visible: true,
            order: 1,
            exportable: true
        },
        {
            id: "pivot",
            title: "Pivot",
            icon: "🔄",
            visible: true,
            order: 2,
            exportable: false
        },
        {
            id: "analytics",
            title: "Analytics",
            icon: "📈",
            visible: true,
            order: 3,
            exportable: true
        },
        {
            id: "tables",
            title: "Tables",
            icon: "📋",
            visible: true,
            order: 4,
            exportable: true
        },
        {
            id: "incidents",
            title: "Incidents",
            icon: "⚠️",
            visible: true,
            order: 5,
            exportable: true
        },
        {
            id: "rejections",
            title: "Rejections",
            icon: "❌",
            visible: true,
            order: 6,
            exportable: true
        },
        {
            id: "guide",
            title: "Guide",
            icon: "❓",
            visible: true,
            order: 7,
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

        // Clear existing tabs except guide
        const existingTabs = tabsContainer.querySelectorAll(".tab:not(.guide-tab)");
        existingTabs.forEach(tab => tab.remove());

        // Add new tabs before guide
        const guidetab = tabsContainer.querySelector(".guide-tab");
        tabs.forEach((tab, index) => {
            if (tab.id !== "guide") {
                const button = document.createElement("button");
                button.className = "tab";
                button.dataset.view = tab.id;
                button.textContent = `${tab.icon || ""} ${tab.title}`;
                
                if (index === 0) {
                    button.classList.add("active");
                }
                
                button.onclick = (e) => {
                    e.preventDefault();
                    APP.view(tab.id);
                };

                if (guidetab) {
                    tabsContainer.insertBefore(button, guidetab);
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
            // Create presentation
            const pres = new PptxGenJS();
            pres.defineLayout({name: 'LAYOUT1', master: 'MASTER1'});

            // Add title slide
            const titleSlide = pres.addSlide();
            titleSlide.background = {color: "0f2d52"};
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

            // Add content from each exportable tab
            const tabs = APP.TabManager.getExportableTabs();
            for (const tab of tabs) {
                if (tab.id === "guide") continue;

                const content = this.getTabContent(tab.id);
                if (content) {
                    await this.addContentToPresentation(pres, tab, content);
                }
            }

            // Save presentation
            pres.writeFile({fileName: `Dashboard_${new Date().toISOString().split('T')[0]}.pptx`});

        } catch (error) {
            console.error("PPT Export Error:", error);
            alert("Error exporting to PPT: " + error.message);
        }
    },

    /**
     * Get content from a tab
     */
    getTabContent: function(tabId) {
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

        // Add section title
        slide.addText(tab.title, {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.5,
            fontSize: 24,
            bold: true,
            color: "0f2d52"
        });

        // Add charts
        for (const canvas of content.canvases) {
            if (canvas.offsetParent !== null) { // Check if visible
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

// Initialize on page load
document.addEventListener("DOMContentLoaded", function() {
    APP.TabManager.renderTabs();
});
