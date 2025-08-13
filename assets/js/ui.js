import { $, $$, fetchJSON } from "./utils.js";

const BASE = document.documentElement.getAttribute("data-base") || ".";
let LANG = localStorage.getItem("lang") || "en";
let DICT = {};

// Кэш элементов
const nav = $(".navbar");
const neon = $(".navbar-neon-container");
const search = $(".search-container");

const root = document.documentElement;

const dropdown = $(".navbar-lang-dropdown");
const current_language = $("#lang-current");
const alt_language = $("#lang-alt");

export function highlightPage() {
    const path = location.pathname.toLowerCase();
    const page = path.includes("/mywork") ? "mywork" :
        path.includes("/contact") ? "contact" : "home";
    const activeId = "nav-" + page;

    $$(".nav-button").forEach(btn =>
        btn.classList.toggle("active-page", btn.id === activeId)
    );
}

export function neonAlign() {
    if (!nav || !neon) return;

    let lastWidth = 0;
    const apply = () => {
        const width = nav.offsetWidth;
        if (width !== lastWidth) {
            neon.style.width = width + "px";
            lastWidth = width;
        }
    };

    apply();
    if ("ResizeObserver" in window) {
        new ResizeObserver(apply).observe(nav);
    } else {
        window.addEventListener("resize", apply);
    }

    ["mouseenter", "mouseleave", "transitionend", "focusin", "focusout"].forEach(event =>
        search?.addEventListener(event, apply, { passive: true })
    );
}

export function animateNeon() {
    let targetSpeed = 50;
    let currentSpeed = 50;
    const acceleration = 0.12;
    let angle = parseFloat(localStorage.getItem("neon-angle")) || 0;
    let last = performance.now();

    let saveTimeout;
    const saveAngle = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem("neon-angle", angle);
        }, 500); // сохраняем не чаще, чем раз в 0.5с
    };

    const frame = (timestamp) => {
        const delta = (timestamp - last) / 1000;
        last = timestamp;

        currentSpeed += (targetSpeed - currentSpeed) * acceleration;
        angle = (angle + currentSpeed * delta) % 360;

        root.style.setProperty("--neon-angle", `${angle}deg`);
        saveAngle(); // сохраняем с задержкой, а не на каждом кадре

        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    nav?.addEventListener("mouseenter", (event) => {
        if (event.target.closest(".nav-button, .search-container")) targetSpeed = 90;
    }, true);

    nav?.addEventListener("mouseleave", (event) => {
        if (event.target.closest(".nav-button, .search-container")) targetSpeed = 50;
    }, true);
}

export async function loadI18n() {
    const data = await fetchJSON(`${BASE}/assets/lang.json`);
    if (data) DICT = data;
}

export function applyI18n(updated = true) {
    const dict = DICT[LANG];
    if (dict) {
        const p = location.pathname.toLowerCase();
        const page = p.includes("/mywork") ? "mywork" :
            p.includes("/contact") ? "contact" : "home";

        const navHome    = $("#nav-home");
        const navMywork  = $("#nav-mywork");
        const navContact = $("#nav-contact");
        const pageTitle  = $("#page-title");

        if (navHome)    navHome.textContent    = dict.home;
        if (navMywork)  navMywork.textContent  = dict.mywork;
        if (navContact) navContact.textContent = dict.contact;
        if (pageTitle)  pageTitle.textContent  = dict[page];
    }

    if (updated) {
        const cur = $("#lang-current img");
        const alt = $("#lang-alt img");
        if (cur && alt) {
            const EN = `${BASE}/assets/img/en-flag.svg`;
            const RU = `${BASE}/assets/img/ru-flag.svg`;
            const [curSrc, curAlt, altSrc, altAlt] =
                LANG === "en" ? [EN, "EN", RU, "RU"] : [RU, "RU", EN, "EN"];
            cur.src = curSrc; cur.alt = curAlt;
            alt.src = altSrc; alt.alt = altAlt;
        }
    }
}

export function initLanguageSelector() {
    current_language?.addEventListener("click", (event) => {
        event.stopPropagation();
        dropdown.classList.toggle("show");
    });

    alt_language?.addEventListener("click", (event) => {
        event.stopPropagation();
        LANG = LANG === "en" ? "ru" : "en";
        localStorage.setItem("lang", LANG);
        applyI18n(true);
        dropdown.classList.remove("show");
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".navbar-lang-dropdown")) {
            dropdown.classList.remove("show");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") dropdown.classList.remove("show");
    });
}
