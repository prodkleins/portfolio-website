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
    const langCurrent = document.getElementById('lang-current');
    const langAlt = document.getElementById('lang-alt');

    if (langCurrent) {
        langCurrent.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown();
        });
    }

    if (langAlt) {
        langAlt.addEventListener('click', function(e) {
            e.stopPropagation();
            selectLang(currentLang === 'en' ? 'ru' : 'en');
        });
    }

    document.querySelectorAll('.navbar-buttons a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navigate(this.getAttribute('href'));
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.navbar-lang-dropdown')) {
            const dropdown = document.getElementById("lang-dropdown");
            if (dropdown?.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    });

    setLang(currentLang);
    highlightCurrentPage();
}

function showCapybara() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('capybara-loading');

    const loader = document.createElement('div');
    loader.id = 'capybara-loader';
    loader.innerHTML = `
<div class="capybaraloader">
  <div class="capybara">
    <div class="capyhead">
      <div class="capyear">
        <div class="capyear2"></div>
      </div>
      <div class="capyear"></div>
      <div class="capymouth">
        <div class="capylips"></div>
        <div class="capylips"></div>
      </div>
      <div class="capyeye"></div>
      <div class="capyeye"></div>
    </div>
    <div class="capyleg"></div>
    <div class="capyleg2"></div>
    <div class="capyleg2"></div>
    <div class="capy"></div>
  </div>
  <div class="loader">
    <div class="loaderline"></div>
  </div>
</div>
    `;

    document.body.appendChild(loader);

    // таймер скрытия
    setTimeout(() => {
        loader.classList.add('hiding');

        document.body.classList.remove('capybara-loading');
        setTimeout(() => {
            loader.remove();
            document.body.style.overflow = '';
        }, 500);
    }, 2000);
}

function highlightCurrentPage() {
    const path = window.location.pathname;

    ['nav-home', 'nav-mywork', 'nav-contact'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.remove("active-page");
    });

    if (path === '/' || path === '/index.html' || path.endsWith('/')) {
        document.getElementById('nav-home').classList.add('active-page');
    } else if (path.includes('/mywork/') || path.includes('mywork')) {
        document.getElementById('nav-mywork').classList.add('active-page');
    } else if (path.includes('/contact/') || path.includes('contact')) {
        document.getElementById('nav-contact').classList.add('active-page');
    }
}

function setLang(lang) {
    currentLang = lang;
    if (!langData[lang]) return;

    document.getElementById("nav-home").textContent = langData[lang].home;
    document.getElementById("nav-mywork").textContent = langData[lang].mywork;
    document.getElementById("nav-contact").textContent = langData[lang].contact;

    const path = window.location.pathname;
    let key = 'home';
    if (path.includes('/mywork/') || path.includes('mywork')) key = 'mywork';
    else if (path.includes('/contact/') || path.includes('contact')) key = 'contact';

    document.getElementById("page-title").textContent = langData[lang][key];

    const currentFlag = document.querySelector('#lang-current img');
    const altFlag = document.querySelector('#lang-alt img');

    if (currentFlag && altFlag) {
        if (lang === 'en') {
            currentFlag.src = '../assets/img/en-flag.svg';
            currentFlag.alt = 'EN';
            altFlag.src = '../assets/img/ru-flag.svg';
            altFlag.alt = 'RU';
        } else {
            currentFlag.src = '../assets/img/ru-flag.svg';
            currentFlag.alt = 'RU';
            altFlag.src = '../assets/img/en-flag.svg';
            altFlag.alt = 'EN';
        }
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById("lang-dropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");
        dropdown.style.zIndex = "1000";
    }
}

function selectLang(lang) {
    setLang(lang);
    const dropdown = document.getElementById("lang-dropdown");
    if (dropdown) dropdown.classList.remove("show");
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

document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('capybaraShown')) {
        sessionStorage.setItem('capybaraShown', 'true');
        showCapybara();
    }
});

window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('capybaraShown');
});

loadLangData();