<template>
  <div class="mywork-page">
    <!-- Page Header -->
    <header class="page-header">
      <h1 class="page-title">{{ $t('myWork.title') }}</h1>
      <p class="page-subtitle">{{ $t('myWork.subtitle') }}</p>
    </header>

    <div class="mywork-content">
      <!-- Category Tabs -->
      <div class="category-tabs" v-show="categories.length > 0">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-wrapper"
          @mouseenter="handleCategoryMouseEnter(category.id)"
          @mouseleave="handleCategoryMouseLeave(category.id)"
        >
          <button
            class="category-tab"
            :class="{ active: activeCategory === category.id }"
            :aria-pressed="activeCategory === category.id"
            @click="handleCategoryClick(category.id)"
          >
            {{ getCategoryLabel(category.id) }}
            <span class="category-count">({{ getCategoryVideoCount(category.id) }})</span>

            <svg
              v-if="!deviceState.isMobile && hasMultipleSubcategories(category.id)"
              class="dropdown-arrow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Dropdown for multiple subcategories -->
          <div
            v-if="!deviceState.isMobile && hasMultipleSubcategories(category.id)"
            class="dropdown-menu"
            :class="{ visible: uiState.dropdowns[category.id] }"
            @mouseenter="handleDropdownMouseEnter(category.id)"
            @mouseleave="handleDropdownMouseLeave(category.id)"
          >
            <button
              v-for="subcategory in category.subcategories"
              :key="subcategory.id"
              class="dropdown-item"
              @click="handleSubcategoryClick(category.id, subcategory.id)"
            >
              <span>{{ getSubcategoryLabel(subcategory.id) }}</span>
              <span class="subcategory-count">{{ getSubcategoryVideoCount(category.id, subcategory.id) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Category Content -->
      <div class="category-content">
        <!-- Loading skeletons -->
        <div v-if="!configLoaded || loading || !activeCategoryData" class="subcategories-container">
          <div class="subcategory-section">
            <div class="subcategory-header">
              <div class="skeleton skeleton-title-large"></div>
            </div>
            <div class="video-grid">
              <VideoSkeleton
                v-for="n in skeletonCount"
                :key="`skeleton-${n}`"
              />
            </div>
          </div>
        </div>

        <!-- Main content -->
        <div v-else class="subcategories-container">
          <div
            v-for="subcategory in visibleSubcategories"
            :key="subcategory.id"
            :id="`subcategory-${subcategory.id}`"
            class="subcategory-section"
          >
            <div class="subcategory-header">
              <h2 class="subcategory-title">{{ getSubcategoryLabel(subcategory.id) }}</h2>
            </div>

            <div class="video-grid">
              <VideoCard
                v-for="video in activeVideos[subcategory.id]"
                :key="video.id"
                :video="video"
              />
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-state">
          <div class="error-message">
            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 13.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { provide, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useVideoCategories } from '@/composables/videos/useVideoCategories.js'
import VideoCard from '@/components/VideoCard.vue'
import VideoSkeleton from '@/components/VideoSkeleton.vue'

const CONFIG = Object.freeze({
  MOBILE_BREAKPOINT: 768,
  DEBOUNCE_DELAY: 150,
  MAX_SKELETON_COUNT: 12,
  DEFAULT_SKELETON_COUNT: 6
});

class DeviceManager {
  constructor() {
    this.state = reactive({ isMobile: false });
    this.listeners = new Set();
    this.resizeObserver = null;

    this.checkIsMobile = this.checkIsMobile.bind(this);
    this.setupObserver();
  }

  checkIsMobile() {
    const wasMobile = this.state.isMobile;
    this.state.isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;

    if (window.matchMedia) {
      this.state.isMobile = window.matchMedia(`(max-width: ${CONFIG.MOBILE_BREAKPOINT}px)`).matches;
    }

    return wasMobile !== this.state.isMobile;
  }

  setupObserver() {
    this.checkIsMobile();

    if (typeof window === 'undefined') return;

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === document.documentElement) {
            this.checkIsMobile();
            break;
          }
        }
      });

      this.resizeObserver.observe(document.documentElement);
    } else {
      const handleResize = () => this.checkIsMobile();
      window.addEventListener('resize', handleResize, { passive: true });
      this.listeners.add(() => window.removeEventListener('resize', handleResize));
    }
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.listeners.forEach(removeListener => {
      try {
        removeListener();
      } catch (e) {
        console.warn('Error removing device listener:', e);
      }
    });
    this.listeners.clear();
  }
}

class UIStateManager {
  constructor() {
    this.state = reactive({
      dropdowns: {},
      scrollPositions: new Map(),
      animations: new WeakMap()
    });

    this.timers = new Map();
  }

  setDropdown(categoryId, isVisible) {
    this.state.dropdowns[categoryId] = isVisible;
  }

  closeAllDropdowns() {
    Object.keys(this.state.dropdowns).forEach(key => {
      this.state.dropdowns[key] = false;
    });
  }

  debounceAction(key, action, delay = CONFIG.DEBOUNCE_DELAY) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const timer = setTimeout(() => {
      action();
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
    return timer;
  }

  destroy() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    Object.keys(this.state.dropdowns).forEach(key => {
      delete this.state.dropdowns[key];
    });

    this.state.scrollPositions.clear();
  }
}

class ScrollManager {
  constructor() {
    this.activeScrolls = new Set();
    this.scrollBehaviorSupported = 'scrollBehavior' in document.documentElement.style;
  }

  async scrollToSubcategory(subcategoryId) {
    const element = document.getElementById(`subcategory-${subcategoryId}`);
    if (!element) return false;

    const scrollKey = `scroll_${subcategoryId}`;

    if (this.activeScrolls.has(scrollKey)) return false;

    this.activeScrolls.add(scrollKey);

    try {
      if (this.scrollBehaviorSupported) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        element.scrollIntoView(true);
      }

      setTimeout(() => {
        this.activeScrolls.delete(scrollKey);
      }, 1000);

      return true;
    } catch (error) {
      console.warn('Scroll error:', error);
      this.activeScrolls.delete(scrollKey);
      return false;
    }
  }

  destroy() {
    this.activeScrolls.clear();
  }
}

const deviceManager = new DeviceManager();
const uiStateManager = new UIStateManager();
const scrollManager = new ScrollManager();

const {
  categories,
  activeCategory,
  activeVideos,
  activeCategoryData,
  loading,
  error,
  configLoaded,
  setActiveCategory,
  getCategoryLabel,
  getSubcategoryLabel,
  getCategoryVideoCount,
  getSubcategoryVideoCount,
  hasMultipleSubcategories,
  cleanup
} = useVideoCategories();

provide('activeCategory', activeCategory)

const deviceState = deviceManager.state;
const uiState = uiStateManager.state;

const visibleSubcategories = computed(() => {
  if (!activeCategoryData.value?.subcategories) return [];

  return activeCategoryData.value.subcategories.filter(subcategory => {
    const videos = activeVideos.value[subcategory.id];
    return videos && videos.length > 0;
  });
});

const skeletonCount = computed(() => {
  if (!activeCategoryData.value) return CONFIG.DEFAULT_SKELETON_COUNT;

  const totalVideos = activeCategoryData.value.subcategories.reduce(
    (total, sub) => total + sub.videos.length,
    0
  );

  return Math.min(totalVideos, CONFIG.MAX_SKELETON_COUNT);
});

const hasAnyVideos = computed(() => {
  return Object.keys(activeVideos.value).length > 0 &&
    Object.values(activeVideos.value).some(videos => videos && videos.length > 0);
});

const handleCategoryMouseEnter = (categoryId) => {
  if (deviceState.isMobile || !hasMultipleSubcategories(categoryId)) return;

  uiStateManager.debounceAction(`mouseenter_${categoryId}`, () => {
    uiStateManager.setDropdown(categoryId, true);
  }, 100);
};

const handleCategoryMouseLeave = (categoryId) => {
  if (deviceState.isMobile) return;

  uiStateManager.debounceAction(`mouseleave_${categoryId}`, () => {
    uiStateManager.setDropdown(categoryId, false);
  }, 300);
};

const handleDropdownMouseEnter = (categoryId) => {
  if (deviceState.isMobile) return;

  const leaveKey = `mouseleave_${categoryId}`;
  if (uiStateManager.timers.has(leaveKey)) {
    clearTimeout(uiStateManager.timers.get(leaveKey));
    uiStateManager.timers.delete(leaveKey);
  }

  uiStateManager.setDropdown(categoryId, true);
};

const handleDropdownMouseLeave = (categoryId) => {
  if (deviceState.isMobile) return;

  uiStateManager.debounceAction(`mouseleave_${categoryId}`, () => {
    uiStateManager.setDropdown(categoryId, false);
  }, 300);
};

const handleCategoryClick = async (categoryId) => {
  if (!deviceState.isMobile) {
    uiStateManager.closeAllDropdowns();
  }

  try {
    await setActiveCategory(categoryId);
  } catch (error) {
    console.error('Error setting category:', error);
  }
};

const handleSubcategoryClick = async (categoryId, subcategoryId) => {
  uiStateManager.closeAllDropdowns();

  try {
    if (activeCategory.value !== categoryId) {
      await setActiveCategory(categoryId);

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await scrollManager.scrollToSubcategory(subcategoryId);
  } catch (error) {
    console.error('Error navigating to subcategory:', error);
  }
};

const scrollToSubcategory = (subcategoryId) => {
  scrollManager.scrollToSubcategory(subcategoryId);
};

const performCleanup = () => {
  try {
    cleanup();
    deviceManager.destroy();
    uiStateManager.destroy();
    scrollManager.destroy();
  } catch (error) {
    console.warn('Cleanup error:', error);
  }
};

onMounted(() => {
  const stop = watch([configLoaded, categories], ([ready]) => {
    if (ready && !activeCategory.value && categories.value.length) {
      setActiveCategory(categories.value[0].id).catch(() => {});
    }
  }, { immediate: true });

  onUnmounted(() => stop());
});

onUnmounted(() => {
  performCleanup();
});
</script>