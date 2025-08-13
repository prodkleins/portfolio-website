import { showCapybaraOnce } from "./capybara.js";
import { neonAlign, animateNeon, highlightPage, initLanguageSelector, loadI18n, applyI18n } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
    showCapybaraOnce(async () => {
        await loadI18n();
        applyI18n();
        neonAlign();
        animateNeon();
        highlightPage();
        initLanguageSelector();
    });
});
