<template>
  <div id="app">
    <div class="video-container">
      <video src="/assets/videos/background.mp4"
             autoplay
             muted
             loop
             playsinline
             class="video-background"
      />
    </div>
    <AppNavbar />
    <router-view />
  </div>
</template>
<script setup>
import AppNavbar from './components/AppNavbar.vue'
</script>
<style>
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
#app > *:not(.video-container) {
  position: relative;
  z-index: 1;
}
</style>