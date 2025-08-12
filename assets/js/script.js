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
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navigate(this.getAttribute('href'));
        });
    });

    setLang(currentLang);
    highlightCurrentPage();
}

if (!sessionStorage.getItem('capybaraShown')) {
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
  `;

    document.body.appendChild(loader);
    sessionStorage.setItem('capybaraShown', 'true');

    // Hide after 2 seconds
    setTimeout(() => {
        document.body.classList.remove('capybara-loading');
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }, 2000);
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

    if (path === '/mywork/') key = 'mywork'; else if (path === '/contact/') key = 'contact';

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