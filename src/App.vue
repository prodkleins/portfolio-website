<template>
  <div id="app">
    <AppFooter />
    <CapybaraLoader @loaded="onLoaderComplete" />
    <div :class="['main-content', { 'content-fade-in': !showContent, 'content-fade-in visible': showContent }]">
      <AppNavbar />
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AppNavbar from './components/AppNavbar.vue'
import AppFooter from './components/AppFooter.vue'
import CapybaraLoader from './components/CapybaraLoader.vue'

const showContent = ref(false)
let timeoutId = null

const onLoaderComplete = () => {
  timeoutId = setTimeout(() => {
    showContent.value = true
  }, 100)
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
  padding-bottom: 80px;
}

#app {
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 70%), #000;
}

#app > .main-content > *:not(.light-leaks-container) {
  position: relative;
  z-index: 2;
}

.content-fade-in {
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.content-fade-in.visible {
  opacity: 1;
}
</style>