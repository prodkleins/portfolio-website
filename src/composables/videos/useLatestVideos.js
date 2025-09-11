import {computed, onUnmounted, ref, watch} from 'vue'
import {useVideoCategories} from '@/composables/videos/useVideoCategories.js'
import youtubeService from '@/services/youtubeService.js'

export function useLatestVideos(count = 3) {
    const latestVideos = ref([])
    const loading = ref(false)
    const error = ref(null)

    const {
        categories,
        configLoaded,
        cleanup: cleanupCategories
    } = useVideoCategories()

    const extractAllVideos = (categoriesData) => {
        const allVideos = []

        categoriesData.forEach(category => {
            if (category.subcategories) {
                category.subcategories.forEach(subcategory => {
                    if (subcategory.videos) {
                        subcategory.videos.forEach(video => {
                            allVideos.push({
                                ...video,
                                categoryId: category.id,
                                subcategoryId: subcategory.id
                            })
                        })
                    }
                })
            }
        })

        return allVideos
    }

    const sortVideosByDate = (videos, videosData) => {
        return videos
                .map(video => {
                    const videoData = videosData.find(data => data.youtubeId === video.youtubeId)
                    return {
                        ...video,
                        publishedAt: videoData?.publishedAt || null,
                        videoData
                    }
                })
                .filter(video => video.publishedAt)
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, count)
                .map(video => video.videoData || video)
    }

    const loadLatestVideos = async () => {
        if (loading.value || !configLoaded.value || !categories.value.length) {
            return
        }

        loading.value = true
        error.value = null

        try {
            const allVideos = extractAllVideos(categories.value)

            if (allVideos.length === 0) {
                latestVideos.value = []
                return
            }

            const videoConfigs = allVideos.map(video => ({
                id: video.id,
                youtubeId: video.youtubeId
            }))

            const videosData = await youtubeService.getCategoryVideosData(videoConfigs)

            latestVideos.value = sortVideosByDate(allVideos, videosData)

        } catch (err) {
            console.error('Failed to load latest videos:', err)
            error.value = err.message
            latestVideos.value = []
        } finally {
            loading.value = false
        }
    }

    const canLoadVideos = computed(() => {
        return configLoaded.value && categories.value.length > 0 && !loading.value
    })

    const cleanup = () => {
        latestVideos.value = []
        loading.value = false
        error.value = null
        cleanupCategories()
    }

    const stopWatcher = watch(
            [configLoaded, categories],
            ([isConfigLoaded, categoriesData]) => {
                if (isConfigLoaded && categoriesData.length > 0 && !loading.value) {
                    loadLatestVideos()
                }
            },
            { immediate: true }
    )

    onUnmounted(() => {
        stopWatcher()
        cleanup()
    })

    return {
        latestVideos,
        loading,
        error,
        canLoadVideos,
        loadLatestVideos,
        cleanup
    }
}