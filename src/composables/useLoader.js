import { ref, readonly } from 'vue'

const isAppLoaded = ref(false)
const isLoaderVisible = ref(true)

export function useLoader() {
    const setAppLoaded = () => {
        isAppLoaded.value = true
    }

    const hideLoader = () => {
        isLoaderVisible.value = false
    }

    const resetLoader = () => {
        isAppLoaded.value = false
        isLoaderVisible.value = true
    }

    return {
        isAppLoaded: readonly(isAppLoaded),
        isLoaderVisible: readonly(isLoaderVisible),
        setAppLoaded,
        hideLoader,
        resetLoader
    }
}