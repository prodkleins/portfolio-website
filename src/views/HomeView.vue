<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-content">
        <div class="avatar-section">
          <div class="avatar-container">
            <div class="avatar-circle">
              <img
                src="/assets/images/avatar.jpg"
                alt="Avatar"
                class="avatar-image"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
        <div class="text-section">
          <h1 class="username">kleins</h1>
          <div class="description-container">
            <span class="description-text" ref="descriptionText"></span>
            <span class="typing-cursor cursor-blink">|</span>
          </div>
        </div>
      </div>
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
            href="https://t.me/kleins0"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
            aria-label="Telegram"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.52.36-.99.54-1.42.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.89 7.98-3.45 3.8-1.58 4.58-1.85 5.09-1.86.11 0 .37.03.53.17.14.12.18.28.2.39-.01.05-.01.24-.03.38z"></path>
            </svg>
          </a>
          <a
            href="https://discord.gg/"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
            aria-label="Discord"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.193.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path>
            </svg>
          </a>
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
            href="https://youtube.com/@kleins0"
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
    </section>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TypeIt from 'typeit'

const descriptionText = ref(null)

const descriptions = [
  'Motion Designer',
  'Game Editor',
  'Python Developer'
]

let typeitInstance = null

onMounted(() => {
  const description = descriptionText.value
  if (!description) return

  typeitInstance = new TypeIt(description, {
    strings: descriptions,
    speed: 180,
    deleteSpeed: 45,
    lifeLike: true,
    breakLines: false,
    nextStringDelay: 2500,
    loop: true,
    loopDelay: [0, 350],
    waitUntilVisible: true,
    cursor: false
  }).go()
})

onUnmounted(() => {
  if (typeitInstance?.destroy) {
    typeitInstance.destroy(true)
  }
  typeitInstance = null
})
</script>

<style scoped>
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  position: relative;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.avatar-section {
  position: relative;
}

.avatar-container {
  position: relative;
  width: 180px;
  height: 180px;
}

.avatar-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #000;
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
  transition: transform 0.3s ease, border-color 0.3s ease;
  contain: layout style paint;
}

.avatar-section:hover .avatar-circle {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.text-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.username {
  font-size: 3rem;
  font-weight: 300;
  color: #fff;
  margin: 0;
  letter-spacing: 1px;
}

.description-container {
  display: flex;
  align-items: center;
  height: 1.8rem;
}

.description-text {
  font-size: 1.1rem;
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

.social-section {
  position: relative;
  contain: layout style paint;
}

.social-links {
  display: flex;
  gap: 1rem;
  padding: 1.2rem 2rem;
  background: #000;
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  contain: layout style paint;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #999;
  text-decoration: none;
  position: relative;
  border-radius: 8px;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  contain: layout style paint;
  transform: translateZ(0);
}

.social-link:hover {
  color: #fff;
  transform: translateZ(0) scale(1.2) translateY(-2px);
}

.social-link svg {
  width: 22px;
  height: 22px;
  pointer-events: none;
}

@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }

  .avatar-container {
    width: 150px;
    height: 150px;
  }

  .username {
    font-size: 2.2rem;
  }

  .description-text {
    font-size: 1rem;
  }

  .social-links {
    gap: 0.8rem;
    padding: 1rem 1.5rem;
  }

  .social-link {
    width: 38px;
    height: 38px;
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
    font-size: 0.9rem;
  }

  .social-links {
    gap: 0.6rem;
    padding: 0.8rem 1.2rem;
  }

  .social-link {
    width: 34px;
    height: 34px;
  }

  .social-link svg {
    width: 20px;
    height: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-cursor {
    animation: none;
    opacity: 1;
  }

  .avatar-circle,
  .social-link {
    transition: none;
  }
}
</style>