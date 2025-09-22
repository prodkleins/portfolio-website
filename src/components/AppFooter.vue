<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="gradient-text">
          {{ $t('home.business-inquiries') }}
        </span>
      </div>
      <div class="carousel-container">
        <div class="carousel-neon">
          <div class="neon-border"></div>
          <div class="neon-glow"></div>
        </div>
        <div class="carousel-track" ref="carouselTrack">
          <div
            v-for="(icon, index) in duplicatedIcons"
            :key="`${icon.id}-${index}`"
            class="carousel-item"
          >
            <img :src="icon.src" :alt="icon.alt" class="program-icon" />
          </div>
        </div>
      </div>
      <div class="footer-right">
        <a
          href="https://github.com/prodkleins/portfolio-website"
          target="_blank"
          rel="noopener noreferrer"
          class="github-button"
          aria-label="GitHub Repository"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, ref } from 'vue'

const carouselTrack = ref(null)

const icons = [
  { id: 'ae', src: '/assets/icons/after-effects.svg', alt: 'After Effects' },
  { id: 'blender', src: '/assets/icons/blender.svg', alt: 'Blender' },
  { id: 'vegas', src: '/assets/icons/vegas.svg', alt: 'Vegas Pro' }
]

const duplicatedIcons = computed(() => {
  const copies = 4
  const result = []
  for (let i = 0; i < copies; i++) {
    result.push(...icons)
  }
  return result
})

const setCarouselSpeed = (speed) => {
  if (carouselTrack.value) {
    const duration = 15 / speed
    carouselTrack.value.style.animationDuration = `${duration}s`
  }
}

defineExpose({
  setCarouselSpeed
})
</script>

<style scoped>
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 9999;
}

.footer-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2rem;
  position: relative;
  max-width: 100vw;
}

.footer-left {
  position: absolute;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
}

.gradient-text {
  font-size: 0.9rem;
  font-weight: 400;
  font-family: 'Montserrat', sans-serif;
  color: #bfbfbf;
}

.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 40px;
  overflow: hidden;
  position: relative;
}

.carousel-track {
  display: flex;
  align-items: center;
  height: 100%;
  will-change: transform;
  animation: carouselMove 37.5s infinite linear;
}

@keyframes carouselMove {
  0% {
    transform: translate3d(-180px, 0, 0);
  }
  100% {
    transform: translate3d(0px, 0, 0);
  }
}

.carousel-item {
  flex: 0 0 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 1;
  transform: scale(1);
}

.program-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  -webkit-filter: grayscale(75%);
  backface-visibility: hidden;
  transform: translateZ(0);
}

.footer-right {
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
}

.github-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #bfbfbf;
  text-decoration: none;
  transition: all 0.3s ease;
  will-change: transform, color;
}

.github-button:hover {
  color: #fff;
  transform: translateZ(0) scale(1.2) translateY(-1px);
}

@media (max-width: 768px) {
  .footer-content {
    padding: 0 1rem;
  }

  .footer-left {
    left: 1rem;
    max-width: calc(100vw - 200px);
  }

  .footer-right {
    right: 1rem;
  }

  .gradient-text {
    font-size: 0.8rem;
    white-space: normal;
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  .carousel-container {
    width: 140px;
    height: 36px;
    margin-left: 1rem;
  }

  .carousel-track {
    animation-duration: 45s;
  }

  .program-icon {
    width: 28px;
    height: 28px;
  }

  .github-button {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .footer-left {
    left: 0.8rem;
    max-width: calc(45vw - 2rem);
  }

  .footer-right {
    right: 0.8rem;
  }

  .gradient-text {
    font-size: 0.7rem;
    line-height: 1.2;
  }

  .carousel-container {
    width: 120px;
    height: 32px;
    margin-left: 1.5rem;
  }

  .program-icon {
    width: 24px;
    height: 24px;
  }

  .github-button {
    width: 32px;
    height: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .carousel-track {
    animation: none;
  }

  .carousel-item {
    transition: none;
  }

  .github-button {
    transition: none;
  }
}
</style>