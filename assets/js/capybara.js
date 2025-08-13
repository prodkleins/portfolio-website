import { sleep } from "./utils.js";

const CAPY_HTML = `
<div class="capybaraloader">
  <div class="capybara">
    <div class="capyhead">
      <div class="capyear"><div class="capyear2"></div></div>
      <div class="capyear"></div>
      <div class="capymouth"><div class="capylips"></div><div class="capylips"></div></div>
      <div class="capyeye"></div><div class="capyeye"></div>
    </div>
    <div class="capyleg"></div>
    <div class="capyleg2"></div><div class="capyleg2"></div>
    <div class="capy"></div>
  </div>
  <div class="loader"><div class="loaderline"></div></div>
</div>
`;

/**
 * Показывает капибару один раз за сессию
 */
export async function showCapybaraOnce(loadCallback) {
    if (sessionStorage.getItem("capybaraShown")) {
        await loadCallback();
        return;
    }
    sessionStorage.setItem("capybaraShown", "1");
    await showCapybaraWhileLoading(loadCallback);
}

/**
 * Показывает капибару и убирает после загрузки
 */
export async function showCapybaraWhileLoading(loadCallback) {
    document.body.style.overflow = "hidden";
    document.body.classList.add("capybara-loading");

    // создаём через fragment
    const fragment = document.createDocumentFragment();
    let loader = document.createElement("div");
    loader.id = "capybara-loader";
    loader.innerHTML = CAPY_HTML;
    fragment.appendChild(loader);
    document.body.appendChild(fragment);

    try {
        await loadCallback(); // грузим важное
    } catch (err) {
        console.error("Ошибка при загрузке:", err);
    }

    await sleep(300);
    loader.classList.add("hiding");

    await sleep(500);
    loader.remove();
    document.body.classList.remove("capybara-loading");
    document.body.style.overflow = "";

    // на всякий случай обнуляем ссылку
    // чтобы сборщик мусора точно освободил память
    // eslint-disable-next-line no-unused-vars
    loader = null;
}
