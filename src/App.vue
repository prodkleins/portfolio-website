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
import { ref, onMounted } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import CapybaraLoader from './components/CapybaraLoader.vue'

const showContent = ref(false)
const videoLoaded = ref(false)

const onLoaderComplete = () => {
  setTimeout(() => {
    showContent.value = true
  }, 100)
}

const onVideoLoaded = () => {
  videoLoaded.value = true
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  const unwatch = () => {
    if (showContent.value) {
      document.body.style.overflow = ''
    } else {
      setTimeout(unwatch, 100)
    }
  }
  unwatch()
})
</script>

<style>
.main-content {
  position: relative;
  min-height: 100vh;
}

.site-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #000000, #090909, #090909, #101010, #000000);
  z-index: -2;
  transition: opacity 1s ease-out;
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