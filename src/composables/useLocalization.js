import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from '@/i18n.js'

export function useLocalization() {
    const { t, locale } = useI18n()

    /**
     * @param {string} key - Ключ перевода
     * @param {any} fallback - Значение по умолчанию
     * @returns {string}
     */
    const getStaticTranslation = (key, fallback = key) => {
        try {
            return i18n.global.t(key)
        } catch (error) {
            console.warn(`Translation key "${key}" not found:`, error)
            return fallback
        }
    }

    /**
     * @param {string} key - Ключ перевода
     * @param {any} fallback - Значение по умолчанию
     * @returns {ComputedRef<string>}
     */
    const getReactiveTranslation = (key, fallback = key) => {
        return computed(() => {
            try {
                return t(key)
            } catch (error) {
                console.warn(`Translation key "${key}" not found:`, error)
                return fallback
            }
        })
    }

    /**
     * Создает объект переводов для сервисов
     * @param {Object} keys - Объект с ключами переводов
     * @returns {Object}
     */
    const createServiceTranslations = (keys) => {
        const translations = {}

        Object.entries(keys).forEach(([name, key]) => {
            translations[name] = getStaticTranslation(key, key)
        })

        return translations
    }

    return {
        t,
        locale,
        getReactiveTranslation,

        getStaticTranslation,
        createServiceTranslations
    }
}

/**
 * Статический хелпер для использования в сервисах без Vue контекста
 */
export const StaticLocalization = {
    /**
     * @param {string} key - Ключ перевода
     * @param {any} fallback - Значение по умолчанию
     * @returns {string}
     */
    t(key, fallback = key) {
        try {
            return i18n.global.t(key)
        } catch (error) {
            console.warn(`Translation key "${key}" not found:`, error)
            return fallback
        }
    },

    /**
     * Создать объект переводов для класса
     * @param {Object} keys - Объект с ключами переводов
     * @returns {Object}
     */
    createTranslations(keys) {
        const translations = {}

        Object.entries(keys).forEach(([name, key]) => {
            translations[name] = this.t(key, key)
        })

        return translations
    }
}