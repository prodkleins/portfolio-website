let langData = {};
let currentLang = "en";

async function loadLangData() {
    try {
        const response = await fetch('../assets/lang.json');
        langData = await response.json();
        initApp();
    } catch (error) {
        console.error('Error loading language data:', error);
    }
}

function initApp() {
    document.getElementById('lang-current').addEventListener('click', toggleDropdown);
    document.getElementById('lang-alt').addEventListener('click', () => {
        selectLang(currentLang === 'en' ? 'ru' : 'en');
    });

    document.querySelectorAll('.navbar-buttons a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigate(this.getAttribute('href'));
        });
    });

    setLang(currentLang);
    highlightCurrentPage();
}

function setLang(lang) {
    currentLang = lang;
    if (!langData[lang]) return;

    document.getElementById("nav-home").textContent = langData[lang].home;
    document.getElementById("nav-mywork").textContent = langData[lang].mywork;
    document.getElementById("nav-contact").textContent = langData[lang].contact;
    document.getElementById("lang-current").textContent = langData[lang].language;
    document.getElementById("lang-alt").textContent = langData[lang].language_alt;

    const path = window.location.pathname;
    let key = 'home';

    if (path === '/mywork/') key = 'mywork';
    else if (path === '/contact/') key = 'contact';

    document.getElementById("page-title").textContent = langData[lang][key];
}

function toggleDropdown() {
    document.getElementById("lang-dropdown").classList.toggle("show");
}

function selectLang(lang) {
    setLang(lang);
    document.getElementById("lang-dropdown").classList.remove("show");
}

function highlightCurrentPage() {
    const path = window.location.pathname;

    ['nav-home', 'nav-mywork', 'nav-contact'].forEach(id => {
        document.getElementById(id).classList.remove("active-page");
    });

    if (path === '/') {
        document.getElementById('nav-home').classList.add('active-page');
    } else if (path === '/mywork/') {
        document.getElementById('nav-mywork').classList.add('active-page');
    } else if (path === '/contact/') {
        document.getElementById('nav-contact').classList.add('active-page');
    }
}

function navigate(path) {
    history.pushState({}, '', path);
    setLang(currentLang);
    highlightCurrentPage();
}

window.addEventListener('popstate', () => {
    setLang(currentLang);
    highlightCurrentPage();
});

window.addEventListener('click', (event) => {
    if (!event.target.matches('.lang-select')) {
        const dropdown = document.getElementById("lang-dropdown");
        if (dropdown?.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});

loadLangData();