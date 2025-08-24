import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

export const useLocaleStore = defineStore('locale', () => {
    const { locale, t } = useI18n()

    const availableLocales = [
        { code: 'en', name: 'English', flag: '/assets/images/en-flag.svg' },
        { code: 'ru', name: 'Русский', flag: '/assets/images/ru-flag.svg' }
    ]

    function setLocale(newLocale) {
        if (availableLocales.some(l => l.code === newLocale)) {
            locale.value = newLocale
            localStorage.setItem('locale', newLocale)
        }
    }

    function toggleLocale() {
        setLocale(locale.value === 'en' ? 'ru' : 'en')
    }

    return {
        currentLocale: locale,
        availableLocales,
        setLocale,
        toggleLocale,
        t
    }
})