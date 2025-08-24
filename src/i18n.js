import { createI18n } from 'vue-i18n'

const loadMessages = async () => {
    try {
        const [en, ru] = await Promise.all([
            import('./assets/locales/en.json'),
            import('./assets/locales/ru.json')
        ])
        return {
            en: en.default,
            ru: ru.default
        }
    } catch (error) {
        console.warn('Could not load translations:', error)
        return { en: {}, ru: {} }
    }
}

const getSavedLocale = () => {
    try {
        const saved = localStorage.getItem('locale')
        return (saved === 'en' || saved === 'ru') ? saved : 'en'
    } catch {
        return 'en'
    }
}

const i18n = createI18n({
    legacy: false,
    locale: getSavedLocale(),
    fallbackLocale: 'en',
    messages: { en: {}, ru: {} },
    missingWarn: false,
    fallbackWarn: false
})

loadMessages().then(loadedMessages => {
    Object.keys(loadedMessages).forEach(locale => {
        i18n.global.setLocaleMessage(locale, loadedMessages[locale])
    })
})

export default i18n