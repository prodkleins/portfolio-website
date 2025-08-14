import { showCapybaraOnce } from "./capybara.js";
import { neonAlign, highlightPage, initLanguageSelector, loadI18n, applyI18n } from "./ui.js";
import { initStars } from "./starnight.js";

document.addEventListener("DOMContentLoaded", () => {
    showCapybaraOnce(async () => {
        await loadI18n();
        applyI18n();
        neonAlign();
        highlightPage();
        initLanguageSelector();
        initStars();
    });
});
