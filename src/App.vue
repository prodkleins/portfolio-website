<template>
  <div id="app">
    <CapybaraLoader @loaded="onLoaderComplete" />
    <AppFooter />
    <div :class="['main-content', { 'content-fade-in': !showContent, 'content-fade-in visible': showContent }]">
      <div class="light-leaks-container">
        <div class="light-leak light-leak-1"></div>
        <div class="light-leak light-leak-2"></div>
        <div class="light-leak light-leak-3"></div>
        <div class="light-leak light-leak-4"></div>
        <div class="light-leak light-leak-5"></div>
        <div class="light-leak light-leak-6"></div>
        <div class="light-leak light-leak-7"></div>
        <div class="light-leak light-leak-8"></div>
        <div class="light-leak light-leak-9"></div>
        <div class="light-leak light-leak-10"></div>
        <div class="background-overlay"></div>
      </div>
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

.light-leaks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
  background: radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 50%, #000000 100%);
}

.light-leak {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  mix-blend-mode: lighten;
  animation-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
  animation-iteration-count: infinite;
  transition: all 2s ease-in-out;
}

.light-leak-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(230, 230, 230, 0.3) 30%, rgba(200, 200, 200, 0.15) 60%, transparent 100%);
  top: 15%;
  left: 5%;
  animation: float1 10s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.7;
}

.light-leak-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(220, 220, 220, 0.6) 0%, rgba(180, 180, 180, 0.35) 30%, rgba(140, 140, 140, 0.2) 60%, transparent 100%);
  top: 50%;
  right: 10%;
  animation: float2 12s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.6;
}

.light-leak-3 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(250, 250, 250, 0.35) 0%, rgba(210, 210, 210, 0.25) 25%, rgba(160, 160, 160, 0.15) 50%, transparent 100%);
  top: 20%;
  right: 20%;
  animation: float3 16s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.5;
}

.light-leak-4 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(200, 200, 200, 0.7) 0%, rgba(170, 170, 170, 0.45) 30%, rgba(120, 120, 120, 0.25) 60%, transparent 100%);
  bottom: 15%;
  left: 20%;
  animation: float4 11s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.6;
}

.light-leak-5 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(240, 240, 240, 0.45) 0%, rgba(190, 190, 190, 0.3) 30%, rgba(150, 150, 150, 0.17) 60%, transparent 100%);
  top: 5%;
  left: 40%;
  animation: float5 18s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.4;
}

.light-leak-6 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(180, 180, 180, 0.75) 0%, rgba(150, 150, 150, 0.5) 25%, rgba(110, 110, 110, 0.3) 50%, transparent 100%);
  bottom: 40%;
  right: 5%;
  animation: float6 13s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.5;
}

.light-leak-7 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(150, 255, 200, 0.45) 0%, rgba(180, 255, 220, 0.3) 25%, rgba(200, 240, 220, 0.18) 45%, rgba(180, 180, 180, 0.1) 65%, transparent 100%);
  top: 70%;
  left: 10%;
  animation: float7 15s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.45;
}

.light-leak-8 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(100, 150, 255, 0.5) 0%, rgba(140, 180, 255, 0.35) 25%, rgba(170, 200, 240, 0.2) 45%, rgba(160, 160, 160, 0.1) 65%, transparent 100%);
  top: 45%;
  left: 60%;
  animation: float8 17s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.6;
}

.light-leak-9 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(200, 150, 255, 0.5) 0%, rgba(220, 180, 255, 0.35) 20%, rgba(230, 200, 250, 0.2) 40%, rgba(190, 190, 190, 0.1) 60%, transparent 100%);
  bottom: 25%;
  right: 40%;
  animation: float9 14s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.5;
}

.light-leak-10 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(255, 200, 100, 0.4) 0%, rgba(255, 220, 140, 0.28) 25%, rgba(240, 220, 180, 0.16) 45%, rgba(200, 200, 200, 0.1) 65%, transparent 100%);
  top: 80%;
  left: 70%;
  animation: float10 20s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
  opacity: 0.4;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
  rgba(0, 0, 0, 0.5) 0%,
  rgba(0, 0, 0, 0.6) 25%,
  rgba(0, 0, 0, 0.75) 50%,
  rgba(0, 0, 0, 0.7) 75%,
  rgba(0, 0, 0, 0.6) 100%);
  z-index: 1;
}

/* Анимации пульсации */
@keyframes pulse1 {
  0%, 100% { opacity: 0.5; filter: blur(120px); }
  50% { opacity: 0.9; filter: blur(100px); }
}

@keyframes pulse2 {
  0%, 100% { opacity: 0.4; filter: blur(120px); }
  50% { opacity: 0.8; filter: blur(90px); }
}

@keyframes pulse3 {
  0%, 100% { opacity: 0.3; filter: blur(120px); }
  50% { opacity: 0.7; filter: blur(110px); }
}

@keyframes pulse4 {
  0%, 100% { opacity: 0.4; filter: blur(120px); }
  50% { opacity: 0.9; filter: blur(80px); }
}

@keyframes pulse5 {
  0%, 100% { opacity: 0.2; filter: blur(120px); }
  50% { opacity: 0.6; filter: blur(100px); }
}

@keyframes pulse6 {
  0%, 100% { opacity: 0.3; filter: blur(120px); }
  50% { opacity: 0.8; filter: blur(90px); }
}

@keyframes pulse7 {
  0%, 100% { opacity: 0.25; filter: blur(120px); }
  50% { opacity: 0.65; filter: blur(105px); }
}

@keyframes pulse8 {
  0%, 100% { opacity: 0.4; filter: blur(120px); }
  50% { opacity: 0.9; filter: blur(85px); }
}

@keyframes pulse9 {
  0%, 100% { opacity: 0.3; filter: blur(120px); }
  50% { opacity: 0.7; filter: blur(95px); }
}

@keyframes pulse10 {
  0%, 100% { opacity: 0.2; filter: blur(120px); }
  50% { opacity: 0.6; filter: blur(100px); }
}

/* Цикличные анимации */
@keyframes float1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  25% {
    transform: translate(150px, -100px) scale(1.2);
    opacity: 0.7;
  }
  50% {
    transform: translate(-50px, 120px) scale(0.8);
    opacity: 0.4;
  }
  75% {
    transform: translate(200px, 50px) scale(1.1);
    opacity: 0.6;
  }
}

@keyframes float2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  33% {
    transform: translate(-200px, -150px) scale(1.3);
    opacity: 0.8;
  }
  66% {
    transform: translate(100px, 80px) scale(0.9);
    opacity: 0.5;
  }
}

@keyframes float3 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  20% {
    transform: translate(-300px, 200px) scale(1.4);
    opacity: 0.3;
  }
  40% {
    transform: translate(200px, -100px) scale(0.7);
    opacity: 0.8;
  }
  60% {
    transform: translate(-100px, -200px) scale(1.2);
    opacity: 0.4;
  }
  80% {
    transform: translate(150px, 100px) scale(0.9);
    opacity: 0.6;
  }
}

@keyframes float4 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(250px, -200px) scale(1.5);
    opacity: 0.9;
  }
}

@keyframes float5 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  16% {
    transform: translate(-400px, 300px) scale(1.6);
    opacity: 0.3;
  }
  33% {
    transform: translate(300px, -200px) scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: translate(-200px, -100px) scale(1.3);
    opacity: 0.5;
  }
  66% {
    transform: translate(100px, 250px) scale(0.9);
    opacity: 0.7;
  }
  83% {
    transform: translate(-100px, -150px) scale(1.2);
    opacity: 0.4;
  }
}

@keyframes float6 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate(-280px, 220px) scale(1.5);
    opacity: 0.8;
  }
  50% {
    transform: translate(320px, -180px) scale(0.6);
    opacity: 0.4;
  }
  75% {
    transform: translate(-180px, -250px) scale(1.3);
    opacity: 0.7;
  }
}

@keyframes float7 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
  }
  33% {
    transform: translate(250px, -300px) scale(1.6);
    opacity: 0.9;
  }
  66% {
    transform: translate(-300px, 180px) scale(0.7);
    opacity: 0.5;
  }
}

@keyframes float8 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
  }
  20% {
    transform: translate(-350px, -250px) scale(1.4);
    opacity: 0.5;
  }
  40% {
    transform: translate(280px, 280px) scale(0.8);
    opacity: 0.9;
  }
  60% {
    transform: translate(-200px, 350px) scale(1.5);
    opacity: 0.4;
  }
  80% {
    transform: translate(350px, -200px) scale(0.9);
    opacity: 0.8;
  }
}

@keyframes float9 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(380px, -320px) scale(1.7);
    opacity: 0.8;
  }
}

@keyframes float10 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
  }
  12% {
    transform: translate(-450px, 350px) scale(1.9);
    opacity: 0.4;
  }
  25% {
    transform: translate(400px, -400px) scale(0.5);
    opacity: 0.9;
  }
  37% {
    transform: translate(-350px, -200px) scale(1.6);
    opacity: 0.5;
  }
  50% {
    transform: translate(300px, 450px) scale(0.8);
    opacity: 0.8;
  }
  62% {
    transform: translate(-400px, 150px) scale(1.4);
    opacity: 0.6;
  }
  75% {
    transform: translate(350px, -350px) scale(1.1);
    opacity: 0.7;
  }
  87% {
    transform: translate(-250px, 300px) scale(1.5);
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding-bottom: 76px;
  }
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