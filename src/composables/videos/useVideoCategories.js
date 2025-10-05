import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import youtubeService from '@/services/youtubeService.js'
import gistService from '@/services/gistService.js'

/**
 * @typedef {Object} Category
 * @property {string} id - ID категории
 * @property {Array} subcategories - Подкатегории
 */

class VideoCategoriesConfig {
    static DEFAULT = Object.freeze({
        REQUEST_TIMEOUT: 30000,
        MAX_CACHE_SIZE: 3,
        SORT_BY_DATE: true,
        USE_GIST: true,
        FALLBACK_TO_LOCAL: true
    });

    constructor(options = {}) {
        Object.assign(this, VideoCategoriesConfig.DEFAULT, options);
        Object.freeze(this);
    }
}

class CategoryNormalizer {
    /**
     * @param {Object} category - Сырые данные категории
     * @returns {Category|null}
     */
    static normalize(category) {
        if (!category?.id) return null;

        const hasSubcategories = category.subcategories?.length > 0;
        const hasVideos = category.videos?.length > 0;

        if (hasSubcategories) {
            return {
                id: category.id,
                subcategories: category.subcategories
            };
        }

        if (hasVideos) {
            return {
                id: category.id,
                subcategories: [{
                    id: category.id,
                    videos: category.videos
                }]
            };
        }

        return {
            id: category.id,
            subcategories: []
        };
    }
}

class ConfigLoader {
    constructor(config) {
        this.config = config;
        this.abortController = null;
        this.isLoading = false;
    }

    /**
     * @returns {Promise<Category[]>}
     */
    async loadCategories() {
        if (this.isLoading) {
            console.log('Categories loading already in progress, skipping...');
            return null;
        }

        this.isLoading = true;

        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();

        try {
            return this.config.USE_GIST
                    ? await this._loadFromGist()
                    : await this._loadLocalConfig();
        } finally {
            this.isLoading = false;
        }
    }

    async _loadFromGist() {
        try {
            console.log('Loading categories from Gist...');
            const data = await gistService.getVideosConfig();
            return this._normalizeCategories(data.categories);
        } catch (error) {
            console.warn('Failed to load from Gist:', error);

            if (this.config.FALLBACK_TO_LOCAL) {
                return this._loadLocalConfig();
            }

            throw error;
        }
    }

    async _loadLocalConfig() {
        try {
            console.log('Loading categories from local file...');

            const response = await fetch('/videos-config.json', {
                signal: this.abortController.signal,
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return this._normalizeCategories(data.categories);

        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }

            console.error('Local config loading failed:', error);
            throw new Error(`Failed to load categories: ${error.message}`);
        }
    }

    _normalizeCategories(categories) {
        return (categories || [])
                .map(CategoryNormalizer.normalize)
                .filter(Boolean);
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isLoading = false;
    }
}

class VideoSorter {
    /**
     * Сортирует видео по дате публикации (от новых к старым)
     * @param {Array} videos - Массив видео
     * @returns {Array} Отсортированный массив видео
     */
    static sortByDate(videos) {
        if (!Array.isArray(videos) || videos.length === 0) {
            return videos;
        }

        return videos.slice().sort((a, b) => {
            const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
            const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
            return dateB - dateA;
        });
    }

    /**
     * Сортирует все видео в группированных данных по подкатегориям
     * @param {Object} groupedData - Данные, группированные по подкатегориям
     * @returns {Object} Данные с отсортированными видео
     */
    static sortGroupedData(groupedData) {
        if (!groupedData || typeof groupedData !== 'object') {
            return groupedData;
        }

        return Object.entries(groupedData).reduce((acc, [subcategoryId, videos]) => {
            acc[subcategoryId] = this.sortByDate(videos);
            return acc;
        }, {});
    }
}

class VideoDataManager {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.destroyed = false;
    }

    /**
     * @param {string} categoryId
     * @param {Category} category
     * @returns {Promise<Object>}
     */
    async loadCategoryVideos(categoryId, category) {
        if (this.destroyed) return {};

        if (this.cache.has(categoryId)) {
            return this.cache.get(categoryId);
        }

        if (this.loadingPromises.has(categoryId)) {
            return this.loadingPromises.get(categoryId);
        }

        const loadPromise = this._performLoad(categoryId, category);
        this.loadingPromises.set(categoryId, loadPromise);

        try {
            return await loadPromise;
        } finally {
            this.loadingPromises.delete(categoryId);
        }
    }

    async _performLoad(categoryId, category) {
        try {
            const videoConfigs = this._extractVideoConfigs(category);

            if (videoConfigs.length === 0) {
                const emptyResult = {};
                this._cacheResult(categoryId, emptyResult);
                return emptyResult;
            }

            const videoData = await youtubeService.getCategoryVideosData(videoConfigs);
            const groupedData = this._groupVideosBySubcategory(videoData, videoConfigs);
            const finalData = this.config.SORT_BY_DATE
                    ? VideoSorter.sortGroupedData(groupedData)
                    : groupedData;

            this._cacheResult(categoryId, finalData);
            return finalData;

        } catch (error) {
            console.error('Video loading failed:', error);
            throw error;
        }
    }

    _extractVideoConfigs(category) {
        return category.subcategories.flatMap(sub =>
                (sub.videos || []).map(video => ({
                    ...video,
                    subcategoryId: sub.id
                }))
        );
    }

    _groupVideosBySubcategory(videoData, videoConfigs) {
        return videoData.reduce((acc, video) => {
            const config = videoConfigs.find(cfg => cfg.id === video.id);
            if (config?.subcategoryId) {
                acc[config.subcategoryId] = acc[config.subcategoryId] || [];
                acc[config.subcategoryId].push(video);
            }
            return acc;
        }, {});
    }

    _cacheResult(categoryId, data) {
        // Управление размером кэша
        if (this.cache.size >= this.config.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(categoryId, data);
    }

    has(categoryId) {
        return this.cache.has(categoryId);
    }

    get(categoryId) {
        return this.cache.get(categoryId) || {};
    }

    clear() {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.clear();
    }
}

class VideoCategoriesState {
    constructor(config) {
        this.config = config;
        this.categories = ref([]);
        this.activeCategory = ref(null);
        this.loading = ref(false);
        this.error = ref(null);
        this.configLoaded = ref(false);
        this.configLoader = new ConfigLoader(config);
        this.videoDataManager = new VideoDataManager(config);
        this.destroyed = false;
        this.updateUnsubscribe = null;
    }

    async loadCategories() {
        if (this.destroyed || this.loading.value) return;

        this.loading.value = true;
        this.error.value = null;

        try {
            const categories = await this.configLoader.loadCategories();

            if (this.destroyed || !categories) return;

            this.categories.value = categories;

            if (categories.length > 0 && !this.activeCategory.value) {
                this.activeCategory.value = categories[0].id;
            }

            this.configLoaded.value = true;

        } catch (error) {
            if (error.name === 'AbortError' || this.destroyed) return;

            console.error('Categories loading failed:', error);
            this.error.value = error.message;
            this.configLoaded.value = true;

        } finally {
            if (!this.destroyed) {
                this.loading.value = false;
            }
        }
    }

    async loadCategoryVideos(categoryId) {
        if (this.destroyed || !categoryId || this.videoDataManager.has(categoryId)) {
            return;
        }

        const category = this.categories.value.find(cat => cat.id === categoryId);
        if (!category) {
            console.warn('Category not found:', categoryId);
            return;
        }

        this.loading.value = true;
        this.error.value = null;

        try {
            await this.videoDataManager.loadCategoryVideos(categoryId, category);
        } catch (error) {
            if (!this.destroyed) {
                console.error('Video loading failed:', error);
                this.error.value = error.message;
            }
        } finally {
            if (!this.destroyed) {
                this.loading.value = false;
            }
        }
    }

    async setActiveCategory(categoryId) {
        if (this.destroyed || this.activeCategory.value === categoryId) return;

        await this._cleanupOldCategory(this.activeCategory.value, categoryId);
        this.activeCategory.value = categoryId;

        if (!this.videoDataManager.has(categoryId)) {
            await this.loadCategoryVideos(categoryId);
        }
    }

    async _cleanupOldCategory(oldCategory, newCategory) {
        if (!oldCategory || oldCategory === newCategory) return;

        this.videoDataManager.cache.delete(oldCategory);

        try {
            const { default: youtubePlayerService } = await import('@/services/youtubePlayerService.js');
            youtubePlayerService.cleanup();
        } catch (error) {
            console.warn('Error cleaning up YouTube players:', error);
        }
    }

    getActiveVideos() {
        return this.activeCategory.value
                ? this.videoDataManager.get(this.activeCategory.value)
                : {};
    }

    getActiveCategoryData() {
        return this.activeCategory.value
                ? this.categories.value.find(cat => cat.id === this.activeCategory.value)
                : null;
    }

    async reloadFromGist() {
        if (this.destroyed) return;

        console.log('Reloading configuration from Gist...');
        gistService.clearCache();
        this.videoDataManager.clear();

        await this.loadCategories();

        if (this.activeCategory.value) {
            await this.loadCategoryVideos(this.activeCategory.value);
        }

        console.log('Configuration reloaded successfully');
    }

    subscribeToUpdates() {
        this.updateUnsubscribe = gistService.onUpdate(() => {
            console.log('Gist updated, reloading data...');
            this.reloadFromGist();
        });
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        if (this.updateUnsubscribe) {
            this.updateUnsubscribe();
            this.updateUnsubscribe = null;
        }

        this.configLoader.abort();
        this.videoDataManager.destroy();

        this.categories.value = [];
        this.activeCategory.value = null;
        this.loading.value = false;
        this.error.value = null;
        this.configLoaded.value = false;
    }
}

export function useVideoCategories(options = {}) {
    const { t } = useI18n();
    const config = new VideoCategoriesConfig(options);
    const state = new VideoCategoriesState(config);

    // computed свойства
    const activeVideos = computed(() => state.getActiveVideos());
    const activeCategoryData = computed(() => state.getActiveCategoryData());

    const getCategoryLabel = (id) => {
        if (state.destroyed) return id;
        try {
            const key = `myWork.categories.${id}`;
            const translated = t(key);
            return translated !== key ? translated : id;
        } catch {
            return id;
        }
    };

    const getSubcategoryLabel = (subcategoryId) => {
        if (state.destroyed) return subcategoryId;

        const prefixes = ['myWork.subcategories', 'myWork.categories'];
        for (const prefix of prefixes) {
            try {
                const key = `${prefix}.${subcategoryId}`;
                const translated = t(key);
                if (translated !== key) return translated;
            } catch {
                continue;
            }
        }
        return subcategoryId;
    };

    const getCategoryVideoCount = (categoryId) => {
        if (state.destroyed) return 0;
        const category = state.categories.value.find(cat => cat.id === categoryId);
        return category?.subcategories?.reduce((total, sub) =>
                total + (sub.videos?.length || 0), 0
        ) || 0;
    };

    const getSubcategoryVideoCount = (categoryId, subcategoryId) => {
        if (state.destroyed) return 0;
        const category = state.categories.value.find(cat => cat.id === categoryId);
        const subcategory = category?.subcategories?.find(sub => sub.id === subcategoryId);
        return subcategory?.videos?.length || 0;
    };

    const hasMultipleSubcategories = (categoryId) => {
        if (state.destroyed) return false;
        const category = state.categories.value.find(cat => cat.id === categoryId);
        return (category?.subcategories?.length || 0) > 1;
    };

    const sortVideosByDate = (videos) => VideoSorter.sortByDate(videos);
    const reloadFromGist = async () => await state.reloadFromGist();

    const stopWatcher = watch(
            [() => state.activeCategory.value, () => state.configLoaded.value],
            async ([categoryId, configLoaded]) => {
                if (state.destroyed || !categoryId || !configLoaded) return;

                if (!state.videoDataManager.has(categoryId)) {
                    try {
                        await state.loadCategoryVideos(categoryId);
                    } catch (error) {
                        console.error('Auto video loading failed:', error);
                    }
                }
            },
            { immediate: true }
    );

    const cleanup = () => {
        stopWatcher();
        state.destroy();
    };

    onMounted(() => {
        state.subscribeToUpdates();
        state.loadCategories().catch(error => {
            console.error('Initial categories loading failed:', error);
        });
    });

    onUnmounted(cleanup);

    if (typeof window !== 'undefined') {
        const handleUnload = () => cleanup();
        window.addEventListener('beforeunload', handleUnload, { once: true });

        if (import.meta.hot) {
            import.meta.hot.dispose(cleanup);
        }
    }

    return {
        categories: state.categories,
        activeCategory: state.activeCategory,
        activeVideos,
        activeCategoryData,
        loading: state.loading,
        error: state.error,
        configLoaded: state.configLoaded,

        setActiveCategory: (id) => state.setActiveCategory(id),
        loadCategoryVideos: (id) => state.loadCategoryVideos(id),
        reloadFromGist,

        getCategoryLabel,
        getSubcategoryLabel,
        getCategoryVideoCount,
        getSubcategoryVideoCount,
        hasMultipleSubcategories,
        sortVideosByDate,

        cleanup
    };
}