class GistServiceConfig {
    static DEFAULT = Object.freeze({
        API_BASE: 'https://api.github.com',
        REQUEST_TIMEOUT: 15000,
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000,
        CACHE_TTL: 5 * 60 * 1000
    });

    constructor(options = {}) {
        Object.assign(this, GistServiceConfig.DEFAULT, options);
        this.gistId = import.meta.env.VITE_GIST_ID;
        this.token = import.meta.env.VITE_GITHUB_TOKEN;

        if (!this.gistId || !this.token) {
            console.warn('Gist configuration missing. Using fallback mode.');
        }

        Object.freeze(this);
    }
}

class GistAPI {
    constructor(config) {
        this.config = config;
        this.fileName = 'videos-config.json';
    }

    async fetchGist() {
        if (!this.config.gistId || !this.config.token) {
            throw new Error('Gist ID or GitHub token not configured');
        }

        const url = `${this.config.API_BASE}/gists/${this.config.gistId}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${this.config.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            this._updateFileName(data.files);
            return data;
        } finally {
            clearTimeout(timeout);
        }
    }

    _updateFileName(files) {
        const foundFileName = Object.keys(files).find(name =>
                name.startsWith('videos-config') && name.endsWith('.json')
        );
        if (foundFileName) {
            this.fileName = foundFileName;
        }
    }

    async updateGist(content) {
        if (!this.config.gistId || !this.config.token) {
            throw new Error('Gist ID or GitHub token not configured');
        }

        const url = `${this.config.API_BASE}/gists/${this.config.gistId}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        [this.fileName]: {
                            content: JSON.stringify(content, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
            }

            return await response.json();
        } finally {
            clearTimeout(timeout);
        }
    }
}

class RetryHandler {
    static NON_RETRYABLE_ERRORS = ['AbortError', '404', '401'];

    static async withRetry(operation, maxAttempts = 2, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (this._isNonRetryable(error) || attempt >= maxAttempts) {
                    throw error;
                }

                await this._delay(delay * Math.pow(2, attempt - 1));
            }
        }

        throw lastError;
    }

    static _isNonRetryable(error) {
        return this.NON_RETRYABLE_ERRORS.some(type =>
                error.name === type || error.message.includes(type)
        );
    }

    static _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class VideoManager {
    constructor(config) {
        this.config = config;
    }

    findCategory(categories, categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }
        return category;
    }

    findSubcategory(category, subcategoryId) {
        if (!category.subcategories) return null;

        const subcategory = category.subcategories.find(s => s.id === subcategoryId);
        if (!subcategory) {
            throw new Error(`Subcategory ${subcategoryId} not found`);
        }
        return subcategory;
    }

    getVideosArray(category, subcategoryId) {
        if (category.subcategories) {
            const subcategory = this.findSubcategory(category, subcategoryId);
            return subcategory.videos = subcategory.videos || [];
        }
        return category.videos = category.videos || [];
    }

    generateVideoId(categoryId, subcategoryId, config) {
        const prefix = subcategoryId || categoryId;
        const category = config.categories.find(c => c.id === categoryId);

        if (!category) {
            return `${prefix}_1`;
        }

        const videos = this._getVideosForGeneration(category, subcategoryId);
        const nextNumber = this._calculateNextNumber(videos);

        return `${prefix}_${nextNumber}`;
    }

    _getVideosForGeneration(category, subcategoryId) {
        if (category.subcategories) {
            const subcategory = category.subcategories.find(s => s.id === subcategoryId);
            return subcategory?.videos || [];
        }
        return category.videos || [];
    }

    _calculateNextNumber(videos) {
        if (videos.length === 0) return 1;

        const numbers = videos
                .map(v => {
                    const match = v.id.match(/_(\d+)$/);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(n => !isNaN(n) && n > 0);

        return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    }

    isVideoIdUnique(config, videoId) {
        for (const category of config.categories) {
            const hasVideo = category.subcategories
                    ? category.subcategories.some(sub => sub.videos?.some(v => v.id === videoId))
                    : category.videos?.some(v => v.id === videoId);

            if (hasVideo) return false;
        }
        return true;
    }

    findAndUpdateVideo(category, subcategoryId, videoId, videoData) {
        const videos = category.subcategories
                ? this.findSubcategory(category, subcategoryId)?.videos
                : category.videos;

        if (!videos) return false;

        const index = videos.findIndex(v => v.id === videoId);
        if (index === -1) return false;

        videos[index] = { ...videos[index], ...videoData };
        return true;
    }

    findAndRemoveVideo(category, subcategoryId, videoId) {
        const videos = category.subcategories
                ? this.findSubcategory(category, subcategoryId)?.videos
                : category.videos;

        if (!videos) return false;

        const index = videos.findIndex(v => v.id === videoId);
        if (index === -1) return false;

        videos.splice(index, 1);
        return true;
    }
}

export class GistService {
    constructor(options = {}) {
        this.config = new GistServiceConfig(options);
        this.api = new GistAPI(this.config);
        this.videoManager = new VideoManager(this.config);
        this.cache = null;
        this.cacheTimestamp = null;
        this.cacheTTL = this.config.CACHE_TTL;
        this.updateCallbacks = new Set();
    }

    onUpdate(callback) {
        this.updateCallbacks.add(callback);
        return () => this.updateCallbacks.delete(callback);
    }

    async getVideosConfig(useCache = true) {
        if (this._isCacheValid(useCache)) {
            return this.cache;
        }

        try {
            const gistData = await RetryHandler.withRetry(
                    () => this.api.fetchGist(),
                    this.config.RETRY_ATTEMPTS,
                    this.config.RETRY_DELAY
            );

            const file = this._findConfigFile(gistData.files);
            const config = JSON.parse(file.content);

            this._updateCache(config);
            return config;
        } catch (error) {
            console.error('Failed to load config from Gist:', error);

            if (this.cache) {
                console.warn('Using cached config');
                return this.cache;
            }

            throw error;
        }
    }

    _isCacheValid(useCache) {
        return useCache &&
                this.cache &&
                this.cacheTimestamp &&
                (Date.now() - this.cacheTimestamp < this.cacheTTL);
    }

    _findConfigFile(files) {
        let file = files['videos-config.json'];

        if (!file) {
            const fileName = Object.keys(files).find(name =>
                    name.startsWith('videos-config') && name.endsWith('.json')
            );
            file = fileName ? files[fileName] : null;
        }

        if (!file?.content) {
            const availableFiles = Object.keys(files).join(', ');
            throw new Error(`videos-config.json not found in Gist. Available files: ${availableFiles}`);
        }

        return file;
    }

    _updateCache(config) {
        this.cache = config;
        this.cacheTimestamp = Date.now();
    }

    async updateVideosConfig(config) {
        if (!config?.categories) {
            throw new Error('Invalid config format');
        }

        try {
            await RetryHandler.withRetry(
                    () => this.api.updateGist(config),
                    this.config.RETRY_ATTEMPTS,
                    this.config.RETRY_DELAY
            );

            this._updateCache(config);
            this._notifyUpdateCallbacks();

            return true;
        } catch (error) {
            console.error('Failed to update Gist:', error);
            throw error;
        }
    }

    _notifyUpdateCallbacks() {
        this.updateCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.warn('Update callback error:', error);
            }
        });
    }

    generateVideoId(categoryId, subcategoryId, config) {
        return this.videoManager.generateVideoId(categoryId, subcategoryId, config);
    }

    isVideoIdUnique(config, videoId) {
        return this.videoManager.isVideoIdUnique(config, videoId);
    }

    async addVideo(categoryId, subcategoryId, videoData) {
        const config = await this.getVideosConfig(false);
        const category = this.videoManager.findCategory(config.categories, categoryId);

        this._ensureVideoId(categoryId, subcategoryId, videoData, config);

        const videos = this.videoManager.getVideosArray(category, subcategoryId);
        videos.push(videoData);

        await this.updateVideosConfig(config);
        return videoData.id;
    }

    _ensureVideoId(categoryId, subcategoryId, videoData, config) {
        if (!videoData.id) {
            videoData.id = this.videoManager.generateVideoId(categoryId, subcategoryId, config);
        }

        if (!this.videoManager.isVideoIdUnique(config, videoData.id)) {
            const errorMsg = videoData.id === this.videoManager.generateVideoId(categoryId, subcategoryId, config)
                    ? 'Generated video ID is not unique'
                    : `Video ID "${videoData.id}" already exists`;
            throw new Error(errorMsg);
        }
    }

    async updateVideo(categoryId, subcategoryId, videoId, videoData) {
        const config = await this.getVideosConfig(false);
        const category = this.videoManager.findCategory(config.categories, categoryId);

        const updated = this.videoManager.findAndUpdateVideo(category, subcategoryId, videoId, videoData);

        if (!updated) {
            throw new Error(`Video ${videoId} not found`);
        }

        await this.updateVideosConfig(config);
        return true;
    }

    async removeVideo(categoryId, subcategoryId, videoId) {
        const config = await this.getVideosConfig(false);
        const category = this.videoManager.findCategory(config.categories, categoryId);

        const removed = this.videoManager.findAndRemoveVideo(category, subcategoryId, videoId);

        if (!removed) {
            throw new Error(`Video ${videoId} not found`);
        }

        await this.updateVideosConfig(config);
        return true;
    }

    clearCache() {
        this.cache = null;
        this.cacheTimestamp = null;
    }

    async checkConnection() {
        try {
            await this.api.fetchGist();
            return { success: true, message: 'Connection OK' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

const gistService = new GistService();
export default gistService;