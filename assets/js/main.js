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
        initStars({
            stars:   { count: 1600, speed: 0.1, clusters: 2 },
            nebulas: { count: 3, alpha: 0.8 },
            meteors: {
                pool: 14,
                angleDeg: 24,       // вправо-вниз
                speedMin: 300, speedMax: 800,
                trailPx: 240,
                activeMin: 1.3, activeMax: 5,
                periodMin: 10, periodMax: 20,
                jitterDeg: 6
            },
            render: { dprMax: 1.5 },
            fps: 60
        });
    });
});
