/**
 * @typedef {Object} PlayerConfig
 * @property {string} videoId - ID видео
 * @property {Object} playerVars - Параметры плеера
 * @property {Object} events - Обработчики событий
 */

/**
 * @typedef {Object} PlayerMetrics
 * @property {number} total - Общее количество плееров
 * @property {number} active - Активные плееры
 * @property {number} inactive - Неактивные плееры
 */

class PlayerServiceConfig {
    static DEFAULT = Object.freeze({
        PLAYER_VARS: {
            autoplay: 0, controls: 1, disablekb: 0, enablejsapi: 1,
            fs: 1, iv_load_policy: 3, modestbranding: 1, playsinline: 1, rel: 0
        },
        LOAD_TIMEOUT: 10000,
        CLEANUP_INTERVAL: 300000, // 5 minutes
        MAX_INACTIVE_TIME: 600000, // 10 minutes
        ENABLE_METRICS: false
    });

    constructor(options = {}) {
        Object.assign(this, PlayerServiceConfig.DEFAULT, options);
        Object.freeze(this);
    }
}

class ResourceTracker {
    constructor() {
        this.resources = new Map();
        this.destroyed = false;
    }

    /**
     * @param {string} type - Тип ресурса
     * @param {any} resource - Ресурс
     * @param {Function} cleanup - Функция очистки
     */
    track(type, resource, cleanup) {
        if (this.destroyed) {
            cleanup?.();
            return;
        }

        if (!this.resources.has(type)) {
            this.resources.set(type, new Set());
        }

        this.resources.get(type).add({ resource, cleanup });
    }

    /**
     * @param {string} type - Тип ресурса для очистки
     */
    cleanup(type) {
        if (this.destroyed) return;

        const resources = this.resources.get(type);
        if (!resources) return;

        resources.forEach(({ cleanup }) => {
            try {
                cleanup?.();
            } catch (error) {
                console.warn(`Resource cleanup error for ${type}:`, error);
            }
        });

        resources.clear();
    }

    cleanupAll() {
        if (this.destroyed) return;

        for (const type of this.resources.keys()) {
            this.cleanup(type);
        }

        this.resources.clear();
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.cleanupAll();
    }
}

class SDKManager {
    constructor(config) {
        this.config = config;
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
        this.resourceTracker = new ResourceTracker();
    }

    async ensureLoaded() {
        if (this.loaded) return true;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this._loadSDK();
        return this.loadPromise;
    }

    async _loadSDK() {
        return new Promise((resolve, reject) => {
            if (window.YT?.Player) {
                this.loaded = true;
                resolve(true);
                return;
            }

            this.loading = true;

            const timeout = setTimeout(() => {
                this.loading = false;
                this._cleanupCallback();
                reject(new Error('YouTube SDK load timeout'));
            }, this.config.LOAD_TIMEOUT);

            this.resourceTracker.track('timers', timeout, () => clearTimeout(timeout));

            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;

            const originalCallback = window.onYouTubeIframeAPIReady;

            const loadCallback = () => {
                clearTimeout(timeout);
                this.loaded = true;
                this.loading = false;

                if (originalCallback && typeof originalCallback === 'function') {
                    try {
                        originalCallback();
                    } catch (error) {
                        console.warn('Original YouTube callback error:', error);
                    }
                }

                resolve(true);
            };

            window.onYouTubeIframeAPIReady = loadCallback;
            this.resourceTracker.track('callbacks', loadCallback, () => {
                if (window.onYouTubeIframeAPIReady === loadCallback) {
                    window.onYouTubeIframeAPIReady = originalCallback || undefined;
                }
            });

            script.onerror = () => {
                clearTimeout(timeout);
                this.loading = false;
                this._cleanupCallback();
                reject(new Error('Failed to load YouTube SDK'));
            };

            document.head.appendChild(script);
            this.resourceTracker.track('scripts', script, () => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            });
        });
    }

    _cleanupCallback() {
        this.resourceTracker.cleanup('callbacks');
    }

    destroy() {
        this.resourceTracker.destroy();
        this.loaded = false;
        this.loading = false;
        this.loadPromise = null;
    }
}

class PlayerRegistry {
    constructor(config) {
        this.config = config;
        this.players = new Map();
        this.metadata = new WeakMap();
        this.destroyed = false;
    }

    /**
     * @param {string} containerId
     * @param {Object} player
     * @param {string} videoId
     */
    register(containerId, player, videoId) {
        if (this.destroyed) return null;

        const playerData = {
            player,
            videoId,
            containerId,
            created: Date.now(),
            lastActivity: Date.now()
        };

        this.players.set(containerId, playerData);

        this.metadata.set(player, {
            containerId,
            videoId,
            managedBy: 'PlayerRegistry'
        });

        this._updateActivity(containerId);
        return playerData;
    }

    /**
     * @param {string} containerId
     * @returns {Object|null}
     */
    get(containerId) {
        if (this.destroyed) return null;

        const data = this.players.get(containerId);
        if (data) {
            this._updateActivity(containerId);
            return data.player;
        }
        return null;
    }

    /**
     * @param {string} containerId
     * @returns {boolean}
     */
    has(containerId) {
        return !this.destroyed && this.players.has(containerId);
    }

    /**
     * @param {string} containerId
     * @returns {boolean}
     */
    remove(containerId) {
        if (this.destroyed) return false;

        const playerData = this.players.get(containerId);
        if (!playerData) return false;

        try {
            if (playerData.player && typeof playerData.player.destroy === 'function') {
                playerData.player.destroy();
            }
        } catch (error) {
            console.warn(`Error destroying player ${containerId}:`, error);
        }

        this.players.delete(containerId);
        return true;
    }

    removeAll() {
        if (this.destroyed) return;

        const containerIds = Array.from(this.players.keys());
        containerIds.forEach(id => this.remove(id));
    }

    cleanupInactive() {
        if (this.destroyed) return 0;

        const now = Date.now();
        const inactiveIds = [];

        for (const [id, data] of this.players) {
            if (now - data.lastActivity > this.config.MAX_INACTIVE_TIME) {
                inactiveIds.push(id);
            }
        }

        inactiveIds.forEach(id => this.remove(id));
        return inactiveIds.length;
    }

    _updateActivity(containerId) {
        const data = this.players.get(containerId);
        if (data) {
            data.lastActivity = Date.now();
        }
    }

    /**
     * @returns {PlayerMetrics}
     */
    getMetrics() {
        if (this.destroyed) {
            return { total: 0, active: 0, inactive: 0 };
        }

        const now = Date.now();
        let active = 0;
        let inactive = 0;

        for (const [, data] of this.players) {
            if (now - data.lastActivity <= this.config.MAX_INACTIVE_TIME) {
                active++;
            } else {
                inactive++;
            }
        }

        return {
            total: this.players.size,
            active,
            inactive
        };
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.removeAll();
    }
}

class AutoCleanupManager {
    constructor(playerRegistry, config) {
        this.playerRegistry = playerRegistry;
        this.config = config;
        this.interval = null;
        this.destroyed = false;
    }

    start() {
        if (this.interval || this.destroyed) return;

        this.interval = setInterval(() => {
            if (!this.destroyed) {
                const cleaned = this.playerRegistry.cleanupInactive();
                if (cleaned > 0) {
                    console.log(`Auto-cleaned ${cleaned} inactive players`);
                }
            }
        }, this.config.CLEANUP_INTERVAL);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.stop();
    }
}

export class YouTubePlayerService {
    constructor(options = {}) {
        this.config = new PlayerServiceConfig(options);
        this.sdkManager = new SDKManager(this.config);
        this.playerRegistry = new PlayerRegistry(this.config);
        this.autoCleanup = new AutoCleanupManager(this.playerRegistry, this.config);
        this.destroyed = false;

        this.metrics = {
            playersCreated: 0,
            playersDestroyed: 0,
            sdkLoadTime: 0,
            errors: 0
        };

        this._setupGlobalCleanup();

        if (this.config.ENABLE_METRICS) {
            this.autoCleanup.start();
        }
    }

    /**
     * @param {string} containerId
     * @param {string} videoId
     * @param {PlayerConfig} options
     * @returns {Promise<Object>}
     */
    async createPlayer(containerId, videoId, options = {}) {
        if (this.destroyed) {
            throw new Error('Service has been destroyed');
        }

        if (!containerId || !videoId) {
            this.metrics.errors++;
            throw new Error('Container ID and video ID are required');
        }

        try {
            const startTime = Date.now();

            await this.sdkManager.ensureLoaded();

            if (this.destroyed) return null;

            this.metrics.sdkLoadTime = Date.now() - startTime;

            const playerOptions = {
                videoId,
                playerVars: {
                    ...this.config.PLAYER_VARS,
                    ...(options.playerVars || {})
                },
                events: options.events || {}
            };

            const player = new window.YT.Player(containerId, playerOptions);

            this.playerRegistry.register(containerId, player, videoId);
            this.metrics.playersCreated++;

            return player;

        } catch (error) {
            this.metrics.errors++;
            console.error('Player creation failed:', error);
            throw error;
        }
    }

    /**
     * @param {string} containerId
     * @returns {boolean}
     */
    destroyPlayer(containerId) {
        if (this.destroyed) return false;

        const success = this.playerRegistry.remove(containerId);
        if (success) {
            this.metrics.playersDestroyed++;
        }
        return success;
    }

    /**
     * @param {string} containerId
     * @returns {Object|null}
     */
    getPlayer(containerId) {
        return this.destroyed ? null : this.playerRegistry.get(containerId);
    }

    /**
     * @param {string} containerId
     * @returns {boolean}
     */
    hasPlayer(containerId) {
        return this.destroyed ? false : this.playerRegistry.has(containerId);
    }

    cleanup() {
        if (this.destroyed) return;

        this.playerRegistry.removeAll();
    }

    getMetrics() {
        return {
            ...this.metrics,
            ...this.playerRegistry.getMetrics(),
            sdkLoaded: this.sdkManager.loaded,
            destroyed: this.destroyed
        };
    }

    updateConfig(newConfig) {
        if (this.destroyed) return;

        this.config = new PlayerServiceConfig({
            ...this.config,
            ...newConfig
        });
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        this.cleanup();
        this.autoCleanup.destroy();
        this.playerRegistry.destroy();
        this.sdkManager.destroy();

        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = 0;
        });

        if (this.config.ENABLE_METRICS) {
            console.log('YouTubePlayerService destroyed:', this.getMetrics());
        }
    }

    _setupGlobalCleanup() {
        if (typeof window === 'undefined') return;

        const cleanup = () => this.destroy();

        ['beforeunload', 'unload', 'pagehide'].forEach(event => {
            window.addEventListener(event, cleanup, { once: true });
        });

        if (import.meta.hot) {
            import.meta.hot.dispose(cleanup);
        }
    }
}

const youtubePlayerService = new YouTubePlayerService();
export default youtubePlayerService;
