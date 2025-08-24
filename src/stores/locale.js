import { defineStore } from 'pinia'

export const useLocaleStore = defineStore('locale', () => {
    const availableLocales = [
        { code: 'en', name: 'English', flag: '/assets/images/en-flag.svg' },
        { code: 'ru', name: 'Русский', flag: '/assets/images/ru-flag.svg' }
    ]

    return { availableLocales }
})