import { ref, readonly } from 'vue'

const isAppLoaded = ref(false)
const isLoaderVisible = ref(true)
const resourcesLoaded = ref(false)

export function useLoader() {
    const setAppLoaded = () => {
        isAppLoaded.value = true
    }

    const setResourcesLoaded = () => {
        resourcesLoaded.value = true
        setAppLoaded()
    }

    const hideLoader = () => {
        isLoaderVisible.value = false
    }

    const resetLoader = () => {
        isAppLoaded.value = false
        isLoaderVisible.value = true
        resourcesLoaded.value = false
    }

    return {
        isAppLoaded: readonly(isAppLoaded),
        isLoaderVisible: readonly(isLoaderVisible),
        resourcesLoaded: readonly(resourcesLoaded),
        setAppLoaded,
        setResourcesLoaded,
        hideLoader,
        resetLoader
    }
}