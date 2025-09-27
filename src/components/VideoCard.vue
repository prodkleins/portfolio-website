<template>
  <div
    ref="cardElement"
    class="video-card"
    @mouseenter="playerInteraction.handleMouseEnter"
    @mouseleave="playerInteraction.handleMouseLeave"
  >
    <div
      class="video-preview"
      :class="previewClasses"
      @click="playerInteraction.handlePreviewClick"
      style="cursor: pointer;"
    >
      <!-- Thumbnail -->
      <img
        :src="thumbnailUrl"
        :alt="video.title"
        class="video-thumbnail"
        :class="thumbnailClasses"
        loading="lazy"
      >

      <!-- Embed Container -->
      <div
        ref="embedContainer"
        class="video-embed"
        :class="{ 'embed-visible': showEmbed }"
      ></div>

      <!-- Loading Indicator -->
      <div
        v-if="isLoadingState"
        class="play-overlay"
        style="background: rgba(0,0,0,0.3);"
      >
        <div class="loading-spinner"></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="isErrorState"
        class="error-overlay"
      >
        <div class="error-content">
          <div class="error-icon-wrapper">
            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6m0-6l6 6"/>
            </svg>
          </div>
          <div class="error-message">
            <p class="error-text">{{ currentError.message }}</p>
          </div>
        </div>
      </div>

      <!-- Play Overlay -->
      <div
        v-else
        class="play-overlay"
        :style="{ opacity: showEmbed ? 0 : 1 }"
      >
        <svg class="play-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>

      <!-- Duration Badge -->
      <div v-if="video.duration && !isErrorState" class="duration-badge">
        {{ video.duration }}
      </div>
    </div>

    <!-- Video Info -->
    <div class="video-info">
      <h3 class="video-title">{{ video.title }}</h3>

      <p v-if="!hideDescription" class="video-description">{{ video.description }}</p>

      <div class="video-stats">
        <StatItem
          v-for="stat in videoStats"
          :key="stat.type"
          :icon="stat.icon"
          :value="stat.value"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h, inject } from 'vue'
import { useYouTubePlayer } from '@/composables/videos/useYoutubePlayer.js'

const STAT_ICONS = Object.freeze({
  views: [
    "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  ],
  likes: [
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
  ],
  comments: [
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
  ]
});

const StatItem = defineComponent({
  name: 'StatItem',
  props: {
    icon: { type: [String, Array], required: true },
    value: { type: [String, Number], required: true }
  },
  setup(props) {
    const paths = computed(() => Array.isArray(props.icon) ? props.icon : [props.icon]);
    return () => h('div', { class: 'stat-item' }, [
      h('svg', {
        class: 'stat-icon',
        viewBox: '0 0 24 24',
        width: '18',
        height: '18',
        'aria-hidden': 'true',
        focusable: 'false'
      }, paths.value.map((d) =>
        h('path', {
          d,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        })
      )),
      h('span', null, String(props.value))
    ]);
  }
});

const props = defineProps({
  video: {
    type: Object,
    required: true,
    validator: (video) => video && video.youtubeId && video.title
  },
  hideDescription: {
    type: Boolean,
    default: false
  }
});

const activeCategory = inject('activeCategory', ref(null));

const cardElement = ref(null);
const embedContainer = ref(null);

const {
  state: playerState,
  error: playerError,
  isHovered,
  isVisible,
  handleMouseEnter,
  handleMouseLeave,
  handlePreviewClick,
  setupIntersectionObserver,
  cleanup: playerCleanup,
  resetUserActivity,
  retryPlayback,
  PLAYER_STATES
} = useYouTubePlayer(props.video.youtubeId, activeCategory);

const playerInteraction = {
  handleMouseEnter: () => {
    resetUserActivity();
    handleMouseEnter();
  },
  handleMouseLeave: () => {
    resetUserActivity();
    handleMouseLeave();
  },
  handlePreviewClick: () => {
    if (!embedContainer.value || isErrorState.value) return;
    resetUserActivity();
    handlePreviewClick(embedContainer.value);
  }
};

const handleRetry = () => {
  resetUserActivity();
  retryPlayback();

  if (embedContainer.value) {
    setTimeout(() => {
      handlePreviewClick(embedContainer.value);
    }, 100);
  }
};

const thumbnailUrl = computed(() => {
  const { thumbnails, youtubeId } = props.video;

  const strategies = [
    () => thumbnails?.high?.url,
    () => thumbnails?.medium?.url,
    () => thumbnails?.default?.url,
    () => `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    () => `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
  ];

  for (const strategy of strategies) {
    const url = strategy();
    if (url) return url;
  }

  return '';
});

const showEmbed = computed(() => {
  return playerState.value === PLAYER_STATES.PLAYER_IDLE ||
    playerState.value === PLAYER_STATES.PLAYER_PLAYING;
});

const isLoadingState = computed(() => {
  return playerState.value === PLAYER_STATES.LOADING;
});

const isErrorState = computed(() => {
  return playerState.value === PLAYER_STATES.ERROR && playerError.value;
});

const currentError = computed(() => {
  return playerError.value || {};
});

const previewClasses = computed(() => ({
  'loaded': true,
  'showing-embed': showEmbed.value,
  'showing-error': isErrorState.value
}));

const thumbnailClasses = computed(() => ({
  'fade-out': showEmbed.value || isErrorState.value,
  'is-hiding': playerState.value !== PLAYER_STATES.THUMBNAIL
}));

const videoStats = computed(() => {
  const formatNumber = (num) => {
    const n = Number(num);
    if (!n || num === 'N/A') return 'N/A';

    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  };

  return [
    {
      type: 'views',
      icon: STAT_ICONS.views,
      value: formatNumber(props.video.views || 0)
    },
    {
      type: 'likes',
      icon: STAT_ICONS.likes,
      value: formatNumber(props.video.likes || 0)
    },
    {
      type: 'comments',
      icon: STAT_ICONS.comments,
      value: formatNumber(props.video.comments || 0)
    }
  ];
});

onMounted(() => {
  if (cardElement.value) {
    setupIntersectionObserver(cardElement.value);
  }
});

onUnmounted(() => {
  playerCleanup();
});

if (import.meta.hot) {
  import.meta.hot.dispose(playerCleanup);
}
</script>

<style scoped src="@/assets/styles/video-card.css"></style>

<style scoped>
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  border-radius: inherit;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  max-width: 90%;
}

.error-icon-wrapper {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgba(255, 107, 107, 0.8);
  filter: drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3));
}

.error-message {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.error-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.retry-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.retry-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.retry-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.video-preview.showing-error {
  border-color: rgba(255, 107, 107, 0.3);
}

.video-preview.showing-error .video-thumbnail.fade-out {
  opacity: 0.3;
}

@media (max-width: 480px) {
  .error-content {
    padding: 1rem;
  }

  .error-icon {
    width: 2rem;
    height: 2rem;
  }

  .error-text {
    font-size: 0.8rem;
  }

  .retry-button {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .retry-button {
    transition: none;
  }

  .retry-button:hover {
    transform: none;
  }

  .retry-button:active {
    transform: none;
  }
}
</style>