/**
 * Tab & View Controller — Manages visibility and rendering of all dashboard sections (Overview, Analytics, Rejections, etc.).
 * Toggles between different views while maintaining state and triggering appropriate render calls.
 * Drives the tab UI highlighting and lazy-load rendering for performance optimization.
 */

APP.view = (id) => {
    if (id === "incidents" || id === "analytics") {
        id = "incidents-overview";
        APP.analyticsMode = "tables";
    }

    if (!APP.g(id)) {
        id = "overview";
    }

    document.querySelectorAll(".view").forEach((v) => v.classList.add("hide"));
    APP.g(id).classList.remove("hide");
    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    document.querySelector(`[data-view="${id}"]`).classList.add("active");
    APP.setSidebarFilterContext?.(id);
    if (window.location.hash !== `#${id}`) {
        history.replaceState(null, "", `#${id}`);
    }
    window.scrollTo(0, 0);

    if (id === "incidents-overview" && APP.DATA.length) {
        setTimeout(APP.draw, 0);
    }

    if (id === "rejections" && APP.filteredRejections.length) {
        setTimeout(APP.draw, 0);
    }
};
