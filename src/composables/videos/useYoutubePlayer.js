import { ref, watch, onUnmounted } from 'vue'
import youtubePlayerService from '@/services/youtubePlayerService.js'
import i18n from '@/i18n.js'

/**
 * Player States Enum
 */
const PLAYER_STATES = Object.freeze({
    THUMBNAIL: 'thumbnail',
    LOADING: 'loading',
    PLAYER_IDLE: 'player_idle',
    PLAYER_PLAYING: 'player_playing',
    ERROR: 'error'
});

/**
 * YouTube Error Types
 */
const YOUTUBE_ERROR_TYPES = Object.freeze({
    INVALID_PARAM: 2,
    HTML5_ERROR: 5,
    VIDEO_NOT_FOUND: 100,
    EMBED_NOT_ALLOWED: 101,
    EMBED_NOT_ALLOWED_ALT: 150,
    NETWORK_ERROR: 'network',
    GEOBLOCKED: 'geoblocked'
});

/**
 * Error Messages Map
 */
const ERROR_MESSAGES = Object.freeze({
    [YOUTUBE_ERROR_TYPES.VIDEO_NOT_FOUND]: () => i18n.global.t('youtube.errors.videoNotFound'),
    [YOUTUBE_ERROR_TYPES.EMBED_NOT_ALLOWED]: () => i18n.global.t('youtube.errors.embedNotAllowed'),
    [YOUTUBE_ERROR_TYPES.EMBED_NOT_ALLOWED_ALT]: () => i18n.global.t('youtube.errors.embedNotAllowed'),
    [YOUTUBE_ERROR_TYPES.HTML5_ERROR]: () => i18n.global.t('youtube.errors.playbackError'),
    [YOUTUBE_ERROR_TYPES.INVALID_PARAM]: () => i18n.global.t('youtube.errors.invalidVideo'),
    [YOUTUBE_ERROR_TYPES.NETWORK_ERROR]: () => i18n.global.t('youtube.errors.networkError'),
    [YOUTUBE_ERROR_TYPES.GEOBLOCKED]: () => i18n.global.t('youtube.errors.geoblocked'),
    default: () => i18n.global.t('youtube.errors.unknown')
});

/**
 * Global Player State - позволяет создавать только один активный плеер
 */
const GLOBAL_PLAYER_STATE = {
    activePlayerId: null,
    activePlayer: null,
    cleanup: null
};

/**
 * Configuration Class
 */
class PlayerConfig {
    constructor(options = {}) {
        this.CLEANUP_DELAY = 10000;
        this.DEBOUNCE_DELAY = 300;
        this.INTERACTION_DELAY = 50;
        this.ERROR_DISPLAY_TIME = 10000;

        Object.assign(this, options);
        Object.freeze(this);
    }
}

/**
 * Resource Manager
 */
class ResourceManager {
    constructor() {
        this.timers = new Set();
        this.observers = new Set();
        this.eventListeners = new Set();
        this.destroyed = false;
    }

    addTimer(timer) {
        if (this.destroyed) {
            clearTimeout(timer);
            return null;
        }
        this.timers.add(timer);
        return timer;
    }

    addObserver(observer) {
        if (this.destroyed) {
            try { observer.disconnect(); } catch {}
            return null;
        }
        this.observers.add(observer);
        return observer;
    }

    addEventListener(element, event, handler, options) {
        if (this.destroyed) return null;

        element.addEventListener(event, handler, options);
        const cleanup = () => element.removeEventListener(event, handler, options);
        this.eventListeners.add(cleanup);
        return cleanup;
    }

    destroy() {
        if (this.destroyed) return;

        this.destroyed = true;

        this.timers.forEach(timer => {
            try { clearTimeout(timer); } catch {}
        });
        this.timers.clear();

        this.observers.forEach(observer => {
            try { observer.disconnect(); } catch {}
        });
        this.observers.clear();

        this.eventListeners.forEach(cleanup => {
            try { cleanup(); } catch {}
        });
        this.eventListeners.clear();
    }
}

/**
 * Player State Manager
 */
class PlayerStateManager {
    constructor(initialState = PLAYER_STATES.THUMBNAIL) {
        this.state = ref(initialState);
        this.error = ref(null);
        this.destroyed = false;
    }

    setState(newState) {
        if (this.destroyed) return false;
        this.state.value = newState;
        return true;
    }

    setError(errorData) {
        if (this.destroyed) return false;
        this.error.value = errorData;
        this.setState(PLAYER_STATES.ERROR);
        return true;
    }

    clearError() {
        if (this.destroyed) return false;
        this.error.value = null;
        return true;
    }

    is(targetState) {
        return !this.destroyed && this.state.value === targetState;
    }

    reset() {
        if (!this.destroyed) {
            this.state.value = PLAYER_STATES.THUMBNAIL;
            this.clearError();
        }
    }

    destroy() {
        this.destroyed = true;
        this.reset();
    }
}

/**
 * Error Handler
 */
class ErrorHandler {
    constructor(stateManager, resourceManager, config) {
        this.stateManager = stateManager;
        this.resourceManager = resourceManager;
        this.config = config;
        this.errorHideTimer = null;
    }

    handleYouTubeError(errorCode) {
        this._clearErrorTimer();

        const errorType = this._mapErrorCode(errorCode);
        const message = this._getErrorMessage(errorType);

        const errorData = {
            type: errorType,
            code: errorCode,
            message,
            timestamp: Date.now(),
            canRetry: this._canRetry(errorType)
        };

        this.stateManager.setError(errorData);

        this.errorHideTimer = this.resourceManager.addTimer(setTimeout(() => {
            if (this.stateManager.is(PLAYER_STATES.ERROR)) {
                this.stateManager.reset();
            }
            this.errorHideTimer = null;
        }, this.config.ERROR_DISPLAY_TIME));

        return errorData;
    }

    _clearErrorTimer() {
        if (this.errorHideTimer) {
            clearTimeout(this.errorHideTimer);
            this.errorHideTimer = null;
        }
    }

    _mapErrorCode(code) {
        if (this._isLikelyGeoblocked(code)) {
            return YOUTUBE_ERROR_TYPES.GEOBLOCKED;
        }

        return YOUTUBE_ERROR_TYPES[code] !== undefined ? code : 'unknown';
    }

    _isLikelyGeoblocked(code) {
        if (code === YOUTUBE_ERROR_TYPES.EMBED_NOT_ALLOWED ||
                code === YOUTUBE_ERROR_TYPES.EMBED_NOT_ALLOWED_ALT) {

            return navigator.language &&
                    (navigator.language.includes('ru') ||
                            navigator.language.includes('cn'));
        }
        return false;
    }

    _getErrorMessage(errorType) {
        const messageGetter = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.default;
        return messageGetter();
    }

    _canRetry(errorType) {
        return errorType !== YOUTUBE_ERROR_TYPES.VIDEO_NOT_FOUND &&
                errorType !== YOUTUBE_ERROR_TYPES.EMBED_NOT_ALLOWED &&
                errorType !== YOUTUBE_ERROR_TYPES.EMBED_NOT_ALLOWED_ALT &&
                errorType !== YOUTUBE_ERROR_TYPES.GEOBLOCKED;
    }

    destroy() {
        this._clearErrorTimer();
    }
}

/**
 * YouTube Player Lifecycle Manager
 */
class PlayerLifecycle {
    constructor(playerId, videoId, stateManager, resourceManager, errorHandler) {
        this.playerId = playerId;
        this.videoId = videoId;
        this.stateManager = stateManager;
        this.resourceManager = resourceManager;
        this.errorHandler = errorHandler;
        this.player = null;
        this.containerId = null;
        this.destroyed = false;
        this.inactivityTimer = null;
        this.isHovered = false;
    }

    async initialize(container) {
        if (this.destroyed || !container) return null;

        try {
            this._forceCleanupAllPlayers();
            this._fullCleanup();
            this.stateManager.clearError();
            this.stateManager.setState(PLAYER_STATES.LOADING);

            this.containerId = `youtube-player-${this.videoId}-${Date.now()}`;

            container.innerHTML = '';

            const playerDiv = document.createElement('div');
            playerDiv.id = this.containerId;
            playerDiv.style.cssText = 'width: 100%; height: 100%; position: relative; z-index: 1;';

            container.appendChild(playerDiv);

            GLOBAL_PLAYER_STATE.activePlayerId = this.playerId;
            GLOBAL_PLAYER_STATE.cleanup = () => this._returnToThumbnail();

            this.player = await youtubePlayerService.createPlayer(
                    this.containerId,
                    this.videoId,
                    {
                        playerVars: {
                            autoplay: 1,
                            controls: 1,
                            enablejsapi: 1,
                            origin: window.location.origin
                        },
                        events: {
                            onReady: () => this._handlePlayerReady(),
                            onStateChange: (event) => this._handlePlayerStateChange(event),
                            onError: (event) => this._handlePlayerError(event)
                        }
                    }
            );

            GLOBAL_PLAYER_STATE.activePlayer = this.player;
            return this.player;

        } catch (error) {
            console.error('Player initialization failed:', error);

            const errorData = this.errorHandler.handleYouTubeError(YOUTUBE_ERROR_TYPES.NETWORK_ERROR);

            this._clearGlobalStateIfThis();
            throw error;
        }
    }

    _handlePlayerReady() {
        if (this.destroyed) return;
        this.stateManager.setState(PLAYER_STATES.PLAYER_IDLE);
    }

    _handlePlayerStateChange(event) {
        if (this.destroyed || !window.YT || !event) return;

        switch (event.data) {
            case window.YT.PlayerState.PLAYING:
                this.stateManager.setState(PLAYER_STATES.PLAYER_PLAYING);
                this._clearInactivityTimer();
                break;

            case window.YT.PlayerState.PAUSED:
                this.stateManager.setState(PLAYER_STATES.PLAYER_IDLE);
                this._startInactivityTimer();
                break;

            case window.YT.PlayerState.ENDED:
                this._returnToThumbnail();
                break;
        }
    }

    _handlePlayerError(event) {
        if (this.destroyed || !event) return;

        console.warn('YouTube player error:', event.data);

        this.errorHandler.handleYouTubeError(event.data);

        this._destroyCurrentPlayer();
    }

    _destroyCurrentPlayer() {
        if (this.player) {
            try {
                if (typeof this.player.stopVideo === 'function') {
                    this.player.stopVideo();
                }
                if (typeof this.player.destroy === 'function') {
                    this.player.destroy();
                }
            } catch (error) {
                console.warn('Error destroying player:', error);
            }
        }

        if (this.containerId) {
            try {
                youtubePlayerService.destroyPlayer(this.containerId);
            } catch (error) {
                console.warn('Error destroying player service:', error);
            }

            const element = document.getElementById(this.containerId);
            if (element) {
                element.innerHTML = '';
            }
        }

        this.player = null;
    }

    _startInactivityTimer() {
        this._clearInactivityTimer();

        this.inactivityTimer = this.resourceManager.addTimer(setTimeout(() => {
            if (!this.destroyed && !this.isHovered) {
                this._returnToThumbnail();
            }
        }, 10000));
    }

    _clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    _returnToThumbnail() {
        if (this.destroyed) return;

        this._destroyCurrentPlayer();
        this.stateManager.reset();
        this._clearGlobalStateIfThis();
    }

    _forceCleanupAllPlayers() {
        if (GLOBAL_PLAYER_STATE.cleanup) {
            try {
                GLOBAL_PLAYER_STATE.cleanup();
            } catch (error) {
                console.warn('Error cleaning up active player:', error);
            }
        }

        GLOBAL_PLAYER_STATE.activePlayerId = null;
        GLOBAL_PLAYER_STATE.activePlayer = null;
        GLOBAL_PLAYER_STATE.cleanup = null;
    }

    _clearGlobalStateIfThis() {
        if (GLOBAL_PLAYER_STATE.activePlayerId === this.playerId) {
            GLOBAL_PLAYER_STATE.activePlayerId = null;
            GLOBAL_PLAYER_STATE.activePlayer = null;
            GLOBAL_PLAYER_STATE.cleanup = null;
        }
    }

    _fullCleanup() {
        this._clearInactivityTimer();
        this._destroyCurrentPlayer();
        this.containerId = null;
    }

    setHovered(isHovered) {
        this.isHovered = isHovered;
        if (isHovered) {
            this._clearInactivityTimer();
        }
    }

    destroy() {
        if (this.destroyed) return;

        this.destroyed = true;
        this._fullCleanup();
        this.errorHandler.destroy();
        this._clearGlobalStateIfThis();
    }
}

/**
 * Interaction Manager
 */
class InteractionManager {
    constructor(resourceManager, config) {
        this.resourceManager = resourceManager;
        this.config = config;
        this.pendingActions = new Map();
        this.destroyed = false;
    }

    debounce(key, action, delay = this.config.DEBOUNCE_DELAY) {
        if (this.destroyed) return;

        const existing = this.pendingActions.get(key);
        if (existing) {
            clearTimeout(existing);
        }

        const timer = this.resourceManager.addTimer(setTimeout(() => {
            this.pendingActions.delete(key);
            if (!this.destroyed) {
                action();
            }
        }, delay));

        this.pendingActions.set(key, timer);
    }

    destroy() {
        if (this.destroyed) return;

        this.destroyed = true;
        this.pendingActions.forEach(timer => {
            try { clearTimeout(timer); } catch {}
        });
        this.pendingActions.clear();
    }
}

export function useYouTubePlayer(videoId, activeCategoryRef, options = {}) {
    const config = new PlayerConfig(options);
    const playerId = `player-${videoId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const resourceManager = new ResourceManager();
    const stateManager = new PlayerStateManager();
    const errorHandler = new ErrorHandler(stateManager, resourceManager, config);
    const lifecycle = new PlayerLifecycle(playerId, videoId, stateManager, resourceManager, errorHandler);
    const interactionManager = new InteractionManager(resourceManager, config);

    const isHovered = ref(false);
    const isVisible = ref(true);
    const userActive = ref(false);

    let userActivityTimer = null;

    const resetUserActivity = () => {
        userActive.value = true;
        if (userActivityTimer) clearTimeout(userActivityTimer);

        userActivityTimer = resourceManager.addTimer(setTimeout(() => {
            userActive.value = false;
        }, 2000));
    };

    const retryPlayback = () => {
        if (stateManager.is(PLAYER_STATES.ERROR)) {
            stateManager.reset();
        }
    };

    const cleanup = () => {
        if (userActivityTimer) {
            clearTimeout(userActivityTimer);
            userActivityTimer = null;
        }

        interactionManager.destroy();
        lifecycle.destroy();
        stateManager.destroy();
        resourceManager.destroy();
    };

    const initializePlayer = async (container) => {
        if (!container) {
            console.warn('No container provided for player initialization');
            return;
        }

        try {
            await lifecycle.initialize(container);
        } catch (error) {
            console.error('Player initialization failed:', error);
        }
    };

    const handleMouseEnter = () => {
        isHovered.value = true;
        lifecycle.setHovered(true);
        resetUserActivity();
    };

    const handleMouseLeave = () => {
        isHovered.value = false;
        lifecycle.setHovered(false);
        resetUserActivity();
    };

    const handlePreviewClick = (container) => {
        if (!container) return;

        resetUserActivity();

        if (stateManager.is(PLAYER_STATES.ERROR)) {
            stateManager.reset();
        }

        initializePlayer(container);
    };

    const setupIntersectionObserver = (element) => {
        if (!element || resourceManager.destroyed) return;

        try {
            const observer = new IntersectionObserver((entries) => {
                if (resourceManager.destroyed) return;

                entries.forEach((entry) => {
                    isVisible.value = entry.isIntersecting;
                    resetUserActivity();

                    if (!entry.isIntersecting &&
                            stateManager.is(PLAYER_STATES.PLAYER_PLAYING) &&
                            GLOBAL_PLAYER_STATE.activePlayerId === playerId) {

                        try {
                            if (lifecycle.player && typeof lifecycle.player.pauseVideo === 'function') {
                                lifecycle.player.pauseVideo();
                            }
                        } catch (error) {
                            console.warn('Error pausing video:', error);
                        }
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(element);
            resourceManager.addObserver(observer);

        } catch (error) {
            console.warn('Failed to setup intersection observer:', error);
        }
    };

    const stopCategoryWatcher = watch(activeCategoryRef, (newCategory, oldCategory) => {
        if (newCategory !== oldCategory) {
            if (GLOBAL_PLAYER_STATE.cleanup) {
                GLOBAL_PLAYER_STATE.cleanup();
            }

            try {
                youtubePlayerService.cleanup();
            } catch (error) {
                console.warn('Error cleaning up player service:', error);
            }

            if (typeof window !== 'undefined' && window.gc) {
                try {
                    window.gc();
                } catch {}
            }
        }
    });

    onUnmounted(() => {
        stopCategoryWatcher();
        cleanup();
    });

    return {
        state: stateManager.state,
        error: stateManager.error,
        isHovered,
        isVisible,
        handleMouseEnter,
        handleMouseLeave,
        handlePreviewClick,
        setupIntersectionObserver,
        initializePlayer,
        cleanup,
        resetUserActivity,
        retryPlayback,
        PLAYER_STATES
    };
}

if (typeof window !== 'undefined') {
    const handleVisibilityChange = () => {
        if (document.hidden && GLOBAL_PLAYER_STATE.cleanup) {
            GLOBAL_PLAYER_STATE.cleanup();

            try {
                youtubePlayerService.cleanup();
            } catch {}
        }
    };

    const handlePageUnload = () => {
        if (GLOBAL_PLAYER_STATE.cleanup) {
            GLOBAL_PLAYER_STATE.cleanup();
        }
        youtubePlayerService.cleanup();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handlePageUnload, { once: true });

    if (import.meta.hot) {
        import.meta.hot.dispose(handlePageUnload);
    }
}