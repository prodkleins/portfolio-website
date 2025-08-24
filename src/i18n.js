/**
 * Переписать этот костыль
 */
import { createI18n } from 'vue-i18n'

let cachedMessages = null
let cachedLocale = null

const getMessages = async () => {
    if (cachedMessages) return cachedMessages
    try {
        const [en, ru] = await Promise.all([
            import('./assets/locales/en.json'),
            import('./assets/locales/ru.json')
        ])

        cachedMessages = {
            en: en.default,
            ru: ru.default
        }

        return cachedMessages
    } catch (error) {
        // fallback на пустые объекты
        console.warn('Could not load translations:', error)
        cachedMessages = { en: {}, ru: {} }
        return cachedMessages
    }
}

const getSavedLocale = () => {
    if (cachedLocale) return cachedLocale
    try {
        const saved = localStorage.getItem('locale')
        cachedLocale = (saved === 'en' || saved === 'ru') ? saved : 'en'
    } catch {
        cachedLocale = 'en'
    }
    return cachedLocale
}

const currentLocale = getSavedLocale()
const messages = { en: {}, ru: {} }

const i18n = createI18n({
    legacy: false,
    locale: currentLocale,
    fallbackLocale: 'en',
    messages,
    missingWarn: false,
    fallbackWarn: false,
    globalInjection: true
})

let messagesLoaded = false
const loadMessages = async () => {
    if (messagesLoaded) return
    try {
        const loadedMessages = await getMessages()
        Object.keys(loadedMessages).forEach(locale => {
            i18n.global.setLocaleMessage(locale, loadedMessages[locale])
        })

        messagesLoaded = true
    } catch (error) {
        console.warn('Failed to load messages:', error)
    }
}

export const setLocale = (locale) => {
    if (locale !== 'en' && locale !== 'ru') return false

    i18n.global.locale.value = locale
    cachedLocale = locale

    try {
        localStorage.setItem('locale', locale)
    } catch {
        // ignore localStorage errors
    }
    return true
}

export const getLocale = () => i18n.global.locale.value

loadMessages()

// глобальная ссылка для доступа из компонентов
if (typeof window !== 'undefined') {
    window.$i18n = i18n
}

export default i18n