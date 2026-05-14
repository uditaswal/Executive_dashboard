APP.view = (id) => {
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hide"));
    APP.g(id).classList.remove("hide");
    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    document.querySelector(`[data-view="${id}"]`).classList.add("active");

    if (id === "analytics" && APP.DATA.length) {
        setTimeout(APP.draw, 0);
    }

    if (id === "rejections" && APP.filteredRejections.length) {
        setTimeout(APP.draw, 0);
    }
};
