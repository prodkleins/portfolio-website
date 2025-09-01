<template>
  <div id="app">
    <CapybaraLoader @loaded="onLoaderComplete" />
    <div :class="['main-content', { 'content-fade-in': !showContent, 'content-fade-in visible': showContent }]">
      <div class="video-container">
        <video
            src="/assets/videos/background.mp4"
            autoplay
            muted
            loop
            playsinline
            class="video-background"
            @loadeddata="onVideoLoaded"
        />
      </div>
      <AppNavbar />
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import CapybaraLoader from './components/CapybaraLoader.vue'

const showContent = ref(false)
const videoLoaded = ref(true)

let timeoutId = null

const onLoaderComplete = () => {
  timeoutId = setTimeout(() => {
    showContent.value = true
  }, 100)
}

const onVideoLoaded = () => {
  videoLoaded.value = true
}

const stopWatcher = watch(showContent, (newValue) => {
  if (newValue) {
    document.body.style.overflow = ''
    stopWatcher()
  }
}, { immediate: true })

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  if (stopWatcher) {
    stopWatcher()
  }

  document.body.style.overflow = ''
})
</script>

<style>
.main-content {
  position: relative;
  min-height: 100vh;
}

.video-container {
  position: fixed;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  overflow: hidden;
  z-index: -1;
}

.video-background {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  object-fit: cover;
  filter: grayscale(100%) blur(8px);
  scale: 1.1;
}

.video-container::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}

#app > .main-content > *:not(.video-container) {
  position: relative;
  z-index: 1;
}
</style>