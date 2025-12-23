<template>
  <div class="home-page">
    <section class="hero-section">
      <!-- Main Content Container -->
      <div class="main-content">
        <!-- Profile Section -->
        <div class="profile-section">
          <div class="hero-content">
            <div class="avatar-section">
              <div class="avatar-container" @mouseenter="flipToSecond" @mouseleave="flipToFirst">
                <div class="avatar-circle" :class="{ 'flipped': isFlipped }">
                  <div class="avatar-side avatar-front">
                    <img
                      src="/assets/images/avatar.jpg"
                      alt="Avatar"
                      class="avatar-image"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div class="avatar-side avatar-back">
                    <img
                      src="/assets/images/avatar2.jpg"
                      alt="Avatar 2"
                      class="avatar-image"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="text-section">
              <Transition name="fade-name" mode="out-in">
                <h1 class="username" :key="currentName">{{ currentName }}</h1>
              </Transition>
              <div class="description-container">
                <span class="description-text" ref="descriptionText"></span>
                <span class="typing-cursor cursor-blink">|</span>
              </div>
            </div>
          </div>
          <Transition name="notification">
            <div v-if="showCopyNotification" class="copy-notification">
              <div class="notification-content">
                <span class="glitch-text" data-text="Discord tag copied!">Discord tag copied!</span>
              </div>
            </div>
          </Transition>
          <div class="social-section">
            <div class="social-links">
              <a
                href="https://instagram.com/prodkleins"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                aria-label="Instagram"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <circle cx="12" cy="12" r="3"></circle>
                  <circle cx="17.5" cy="6.5" r="1"></circle>
                </svg>
              </a>
              <a
                href="https://t.me/prodkleins"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                aria-label="Telegram"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.52.36-.99.54-1.42.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.89 7.98-3.45 3.8-1.58 4.58-1.85 5.09-1.86.11 0 .37.03.53.17.14.12.18.28.2.39-.01.05-.01.24-.03.38z"></path>
                </svg>
              </a>
              <button
                @click="copyDiscordTag"
                class="social-link"
                aria-label="Discord"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.193.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path>
                </svg>
              </button>
              <a
                href="https://tiktok.com/@prodkleins"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                aria-label="TikTok"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"></path>
                </svg>
              </a>
              <a
                href="https://youtube.com/@bykleins"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link"
                aria-label="YouTube"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div class="latest-videos-section">
          <div class="section-header">
            <h2 class="section-title">{{ $t('home.latest-works') }}</h2>
            <div class="section-divider"></div>
          </div>

          <div class="videos-container">
            <div v-if="loading || !latestVideos.length" class="video-grid">
              <VideoSkeleton v-for="n in 3" :key="`skeleton-${n}`" />
            </div>

            <div v-else class="video-grid">
              <VideoCard
                v-for="video in latestVideos"
                :key="video.id"
                :video="video"
                :hide-description="true"
              />
            </div>
            <div v-if="error && !loading" class="error-state">
              <p class="error-message">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, provide } from 'vue'
import TypeIt from 'typeit'
import VideoCard from '@/components/VideoCard.vue'
import VideoSkeleton from '@/components/VideoSkeleton.vue'
import { useLatestVideos } from '@/composables/videos/useLatestVideos.js'

const descriptionText = ref(null)
const showCopyNotification = ref(false)
const isFlipped = ref(false)

const {
  latestVideos,
  loading,
  error
} = useLatestVideos(3)

const activeCategory = ref(null)
provide('activeCategory', activeCategory)

const currentName = computed(() => (isFlipped.value ? 'Soren Johansen' : "kleins"))

let typeitInstance = null
let notificationTimer = null

const descriptions = ['Motion Designer', 'Game Editor', 'Developer']

const flipToSecond = () => {
  isFlipped.value = true
}

const flipToFirst = () => {
  isFlipped.value = false
}

const copyDiscordTag = async () => {
  if (showCopyNotification.value) return

  const discordTag = 'kleins0'

  try {
    await navigator.clipboard.writeText(discordTag)
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = discordTag
      textarea.style.cssText = 'position:fixed;left:-9999px;opacity:0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      if (document.getSelection) {
        const selection = document.getSelection()
        selection.removeAllRanges()
        const range = document.createRange()
        range.selectNodeContents(textarea)
        selection.addRange(range)
      }

      document.body.removeChild(textarea)
    } catch (fallbackError) {
      console.warn('Copy to clipboard failed:', fallbackError)
      return
    }
  }

  showCopyNotification.value = true

  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }

  notificationTimer = setTimeout(() => {
    showCopyNotification.value = false
    notificationTimer = null
  }, 2800)
}

const initTypewriter = () => {
  if (!descriptionText.value) return

  typeitInstance = new TypeIt(descriptionText.value, {
    strings: descriptions,
    speed: 90,
    deleteSpeed: 45,
    lifeLike: true,
    breakLines: false,
    nextStringDelay: 1250,
    loop: true,
    loopDelay: [0, 250],
    waitUntilVisible: true,
    cursor: false
  }).go()
}

onMounted(() => {
  initTypewriter()
})

onUnmounted(() => {
  if (typeitInstance?.destroy) {
    typeitInstance.destroy(true)
  }
  typeitInstance = null

  if (notificationTimer) {
    clearTimeout(notificationTimer)
    notificationTimer = null
  }
})
</script>

<style scoped>
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  padding: 3rem 2rem 2rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
  gap: 3rem;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.avatar-section {
  position: relative;
  perspective: 1000px;
}

.avatar-container {
  position: relative;
  width: 160px;
  height: 160px;
}

.avatar-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  border: 2px solid rgba(255, 255, 255, 0.1);
  contain: layout style paint;
}

.avatar-circle.flipped {
  transform: rotateY(180deg);
}

.avatar-side {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  backface-visibility: hidden;
  background: #000;
}

.avatar-front {
  transform: rotateY(0deg);
}

.avatar-back {
  transform: rotateY(180deg);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-container:hover .avatar-circle {
  border-color: rgba(255, 255, 255, 0.3);
}

.text-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.username {
  font-size: 2.5rem;
  font-weight: 300;
  color: #fff;
  margin: 0;
  letter-spacing: 1px;
}

.fade-name-enter-active,
.fade-name-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-name-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-name-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.description-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.8rem;
}

.description-text {
  font-size: 1rem;
  color: #999;
  font-weight: 300;
  letter-spacing: 0.5px;
  min-height: 1.3rem;
}

.typing-cursor {
  color: #999;
  font-weight: 300;
  margin-left: 2px;
  opacity: 1;
}

.cursor-blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Copy notification */
.copy-notification {
  position: absolute;
  left: 50%;
  bottom: -2.8rem;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  z-index: 10;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}

.notification-content {
  padding: 0.6rem 1.3rem;
  position: relative;
  overflow: hidden;
}

.notification-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
  animation: shimmer 1.8s ease-in-out;
}

.glitch-text {
  position: relative;
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.3px;
  color: #fff;
  animation: textGlitch 0.5s ease-in-out;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  pointer-events: none;
}

.glitch-text::before {
  animation: glitchTop 0.5s ease-in-out;
  color: #ff1744;
  z-index: -1;
}

.glitch-text::after {
  animation: glitchBottom 0.5s ease-in-out;
  color: #00e5ff;
  z-index: -2;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.notification-enter-from {
  opacity: 0;
  transform: translate(-50%, 12px) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px) scale(0.95);
}

@keyframes shimmer {
  to { left: 100%; }
}

@keyframes textGlitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-0.5px, 0.5px); }
  40% { transform: translate(-0.5px, -0.5px); }
  60% { transform: translate(0.5px, 0.5px); }
  80% { transform: translate(0.5px, -0.5px); }
}

@keyframes glitchTop {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-1px, -1px); }
  40% { transform: translate(-1px, 1px); }
  60% { transform: translate(1px, -1px); }
  80% { transform: translate(1px, 1px); }
}

@keyframes glitchBottom {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(1px, 1px); }
  40% { transform: translate(1px, -1px); }
  60% { transform: translate(-1px, 1px); }
  80% { transform: translate(-1px, -1px); }
}

.social-section {
  position: relative;
  contain: layout style paint;
}

.social-links {
  display: flex;
  gap: 0.8rem;
  padding: 1rem 1.8rem;
  background: #000;
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  contain: layout style paint;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #999;
  text-decoration: none;
  position: relative;
  border-radius: 8px;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  contain: layout style paint;
  transform: translateZ(0);
}

.social-link:hover {
  color: #fff;
  transform: translateZ(0) scale(1.15) translateY(-2px);
}

.social-link svg {
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.latest-videos-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
  align-items: center;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 300;
  color: #fff;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.section-divider {
  height: 1px;
  width: 60px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  position: relative;
}

.section-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
}

.videos-container {
  width: 100%;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  justify-content: center;
  align-items: start;
  width: 100%;
  max-width: 1400px;
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.error-message {
  color: rgba(255, 107, 107, 0.8);
  font-size: 0.9rem;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

@media (max-width: 1200px) {
  .main-content {
    gap: 2.5rem;
  }

  .video-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .hero-section {
    padding-top: 4rem;
  }

  .main-content {
    gap: 2rem;
  }

  .video-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 4rem 1.5rem 1.5rem;
  }

  .main-content {
    gap: 1.5rem;
  }

  .avatar-container {
    width: 140px;
    height: 140px;
  }

  .username {
    font-size: 2rem;
  }

  .description-text {
    font-size: 0.9rem;
  }

  .section-title {
    font-size: 1.4rem;
  }

  .video-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 100%;
  }

  .social-links {
    gap: 0.6rem;
    padding: 0.8rem 1.4rem;
  }

  .social-link {
    width: 34px;
    height: 34px;
  }

  .social-link svg {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .avatar-container {
    width: 120px;
    height: 120px;
  }

  .username {
    font-size: 1.8rem;
  }

  .description-text {
    font-size: 0.85rem;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .social-links {
    gap: 0.5rem;
    padding: 0.7rem 1.2rem;
  }

  .social-link {
    width: 32px;
    height: 32px;
  }

  .social-link svg {
    width: 16px;
    height: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-cursor {
    animation: none;
    opacity: 1;
  }

  .avatar-circle {
    transition: none;
  }

  .social-link {
    transition: none;
  }

  .copy-notification {
    animation: none;
  }

  .glitch-text,
  .glitch-text::before,
  .glitch-text::after {
    animation: none;
  }
}
</style>
