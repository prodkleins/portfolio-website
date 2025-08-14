export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Чтение JSON конфигурации
 * @param {path} url - путь до конфигурационного файла
 * @returns {Promise<void>}
 */

export async function fetchJSON(url) {
    try {
        const res = await fetch(url, { cache: "no-store" });
        return res.ok ? res.json() : null;
    } catch {
        return null;
    }
}

/**
 * Пауза на заданное количество миллисекунд
 * @param {number} ms — время ожидания в миллисекундах
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}