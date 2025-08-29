/**
 * @typedef {Object} VideoConfig
 * @property {string} id - Внутренний ID видео
 * @property {string} youtubeId - YouTube ID видео
 * @property {string} [subcategoryId] - ID подкатегории
 */

/**
 * @typedef {Object} VideoData
 * @property {string} id - Внутренний ID
 * @property {string} youtubeId - YouTube ID
 * @property {string} title - Название видео
 * @property {string} description - Описание
 * @property {Object} thumbnails - Миниатюры
 * @property {number|string} views - Количество просмотров
 * @property {number|string} likes - Лайки
 * @property {number|string} comments - Комментарии
 * @property {string} duration - Длительность
 * @property {string|null} publishedAt - Дата публикации
 * @property {string} channelTitle - Название канала
 */

class YouTubeServiceConfig {
    static DEFAULT = Object.freeze({
        CACHE_TTL: 30 * 60 * 1000, // 30 минут
        MAX_BATCH_SIZE: 50,
        MAX_CACHE_SIZE: 100,
        REQUEST_TIMEOUT: 10000,
        MAX_DESCRIPTION_LENGTH: 200,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000
    });

    constructor(options = {}) {
        Object.assign(this, YouTubeServiceConfig.DEFAULT, options);
        Object.freeze(this);
    }
}

class LRUCache {
    /**
     * @param {number} maxSize - Максимальный размер кэша
     * @param {number} ttl - Время жизни записи в мс
     */
    constructor(maxSize = 100, ttl = 30 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.data = new Map();
        this.destroyed = false;
    }

    /**
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
        if (this.destroyed) return null;

        const entry = this.data.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.data.delete(key);
            return null;
        }

        // LRU: перемещаем в конец
        this.data.delete(key);
        this.data.set(key, entry);
        return entry.data;
    }

    /**
     * @param {string} key
     * @param {any} data
     */
    set(key, data) {
        if (this.destroyed) return;

        const entry = {
            data,
            expiry: Date.now() + this.ttl,
            created: Date.now()
        };

        this.data.set(key, entry);
        this._evictOldest();
    }

    _evictOldest() {
        while (this.data.size > this.maxSize) {
            const firstKey = this.data.keys().next().value;
            this.data.delete(firstKey);
        }
    }

    clear() {
        this.data.clear();
    }

    cleanup() {
        if (this.destroyed) return 0;

        const now = Date.now();
        const expiredKeys = [];

        for (const [key, entry] of this.data) {
            if (entry.expiry <= now) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.data.delete(key));
        return expiredKeys.length;
    }

    destroy() {
        this.destroyed = true;
        this.clear();
    }

    get size() {
        return this.data.size;
    }

    get stats() {
        const now = Date.now();
        let expired = 0;
        let valid = 0;

        for (const [, entry] of this.data) {
            if (entry.expiry <= now) expired++;
            else valid++;
        }

        return { total: this.data.size, valid, expired };
    }
}

class RequestManager {
    constructor() {
        this.activeRequests = new Set();
        this.abortController = new AbortController();
        this.destroyed = false;
    }

    /**
     * @returns {AbortSignal}
     */
    createSignal() {
        return this.destroyed ? null : this.abortController.signal;
    }

    /**
     * @param {Promise} promise
     * @returns {Promise}
     */
    track(promise) {
        if (this.destroyed) return Promise.reject(new Error('RequestManager destroyed'));

        this.activeRequests.add(promise);
        return promise.finally(() => {
            this.activeRequests.delete(promise);
        });
    }

    abortAll() {
        if (this.destroyed) return;

        this.abortController.abort();
        this.abortController = new AbortController();
        this.activeRequests.clear();
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.abortAll();
    }

    get pendingCount() {
        return this.activeRequests.size;
    }
}

class RetryHandler {
    /**
     * @param {Function} operation - Операция для повтора
     * @param {number} maxAttempts - Максимальное количество попыток
     * @param {number} delay - Базовая задержка в мс
     * @returns {Promise<any>}
     */
    static async withExponentialBackoff(operation, maxAttempts = 2, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (error.name === 'AbortError' ||
                        error.message.includes('403') ||
                        error.message.includes('401') ||
                        error.message.includes('404')) {
                    throw error;
                }

                if (attempt === maxAttempts) break;

                await new Promise(resolve =>
                        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
                );
            }
        }

        throw lastError;
    }
}

class YouTubeAPI {
    constructor(config) {
        this.config = config;
    }

    /**
     * @param {string[]} videoIds
     * @param {AbortSignal|null} externalSignal
     * @returns {Promise<Array>}
     */
    async fetchVideosData(videoIds, externalSignal = null) {
        if (!videoIds?.length) return [];

        const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error('YouTube API key not configured');
        }

        const url = new URL('https://www.googleapis.com/youtube/v3/videos');
        url.searchParams.set('part', 'snippet,statistics,contentDetails');
        url.searchParams.set('id', videoIds.join(','));
        url.searchParams.set('key', apiKey);
        url.searchParams.set('maxResults', String(this.config.MAX_BATCH_SIZE));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

        const signals = [controller.signal];
        if (externalSignal && !externalSignal.aborted) {
            signals.push(externalSignal);
        }

        const combinedController = new AbortController();
        signals.forEach(signal => {
            if (signal?.aborted) {
                combinedController.abort();
            } else if (signal) {
                signal.addEventListener('abort', () => combinedController.abort(), { once: true });
            }
        });

        try {
            const response = await fetch(url.toString(), {
                signal: combinedController.signal,
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data?.error) {
                throw new Error(`YouTube API error: ${data.error.message}`);
            }

            return data.items || [];
        } finally {
            clearTimeout(timeout);
        }
    }
}

class VideoDataTransformer {
    constructor(config) {
        this.config = config;
    }

    /**
     * @param {Object} apiData - Данные от YouTube API
     * @param {VideoConfig} config - Конфигурация видео
     * @returns {VideoData}
     */
    transform(apiData, config) {
        const { snippet = {}, statistics = {}, contentDetails = {} } = apiData;

        return {
            id: config.id,
            youtubeId: apiData.id,
            title: snippet.title || 'Название недоступно',
            description: this._truncateText(snippet.description || 'Описание недоступно'),
            thumbnails: snippet.thumbnails || this._getDefaultThumbnails(apiData.id),
            views: this._parseNumber(statistics.viewCount),
            likes: this._parseNumber(statistics.likeCount),
            comments: this._parseNumber(statistics.commentCount),
            duration: this._formatDuration(contentDetails.duration),
            publishedAt: snippet.publishedAt || null,
            channelTitle: snippet.channelTitle || 'Неизвестный канал'
        };
    }

    /**
     * @param {VideoConfig} config
     * @returns {VideoData}
     */
    createPlaceholder(config) {
        return {
            id: config.id,
            youtubeId: config.youtubeId,
            title: 'Загрузка...',
            description: 'Загрузка описания...',
            thumbnails: this._getDefaultThumbnails(config.youtubeId),
            views: 'N/A',
            likes: 'N/A',
            comments: 'N/A',
            duration: 'N/A',
            publishedAt: null,
            channelTitle: 'Загрузка...'
        };
    }

    _truncateText(text, maxLength = this.config.MAX_DESCRIPTION_LENGTH) {
        if (!text || text.length <= maxLength) return text;
        return `${text.slice(0, maxLength).trim()}...`;
    }

    _parseNumber(value) {
        if (!value) return 'N/A';
        const num = parseInt(value, 10);
        return Number.isNaN(num) ? 'N/A' : num;
    }

    _formatDuration(isoDuration) {
        if (!isoDuration) return 'N/A';

        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 'N/A';

        const [, h = '0', m = '0', s = '0'] = match;
        const hours = parseInt(h, 10);
        const minutes = parseInt(m, 10);
        const seconds = parseInt(s, 10);

        const pad = (n) => n.toString().padStart(2, '0');

        return hours > 0
                ? `${hours}:${pad(minutes)}:${pad(seconds)}`
                : `${minutes}:${pad(seconds)}`;
    }

    _getDefaultThumbnails(videoId) {
        const base = 'https://img.youtube.com/vi';
        return {
            default: { url: `${base}/${videoId}/default.jpg`, width: 120, height: 90 },
            medium: { url: `${base}/${videoId}/mqdefault.jpg`, width: 320, height: 180 },
            high: { url: `${base}/${videoId}/hqdefault.jpg`, width: 480, height: 360 }
        };
    }
}

export class YouTubeService {
    constructor(options = {}) {
        this.config = new YouTubeServiceConfig(options);
        this.cache = new LRUCache(this.config.MAX_CACHE_SIZE, this.config.CACHE_TTL);
        this.requestManager = new RequestManager();
        this.api = new YouTubeAPI(this.config);
        this.transformer = new VideoDataTransformer(this.config);
        this.destroyed = false;

        this._setupCleanupTimer();
        this._setupGlobalCleanup();
    }

    /**
     * @param {VideoConfig[]} configs
     * @param {AbortSignal|null} externalSignal
     * @returns {Promise<VideoData[]>}
     */
    async getCategoryVideosData(configs = [], externalSignal = null) {
        if (this.destroyed || !Array.isArray(configs) || configs.length === 0) {
            return [];
        }

        const cacheKey = configs
                .map(c => c.youtubeId)
                .sort()
                .join(',');

        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const operation = async () => {
            const videoIds = configs.map(c => c.youtubeId);
            const apiData = await this.api.fetchVideosData(videoIds, externalSignal);

            const results = configs.map(config => {
                const apiItem = apiData.find(item => item.id === config.youtubeId);
                return apiItem
                        ? this.transformer.transform(apiItem, config)
                        : this.transformer.createPlaceholder(config);
            });

            if (!this.destroyed) {
                this.cache.set(cacheKey, results);
            }

            return results;
        };

        return this.requestManager.track(
                RetryHandler.withExponentialBackoff(
                        operation,
                        this.config.RETRY_ATTEMPTS,
                        this.config.RETRY_DELAY
                )
        );
    }

    abortAll() {
        if (!this.destroyed) {
            this.requestManager.abortAll();
        }
    }

    clearCache() {
        if (!this.destroyed) {
            this.cache.clear();
        }
    }

    getStats() {
        return {
            cache: this.cache.stats,
            requests: {
                pending: this.requestManager.pendingCount
            },
            destroyed: this.destroyed
        };
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        this.abortAll();
        this.cache.destroy();
        this.requestManager.destroy();

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    _setupCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            if (!this.destroyed) {
                this.cache.cleanup();
            }
        }, 5 * 60 * 1000); // 5 минут
    }

    _setupGlobalCleanup() {
        if (typeof window === 'undefined') return;

        const cleanup = () => this.destroy();

        window.addEventListener('beforeunload', cleanup, { once: true });

        if (import.meta.hot) {
            import.meta.hot.dispose(cleanup);
        }
    }
}

const youtubeService = new YouTubeService();
export default youtubeService;
