<template>
  <Teleport to="body">
    <div
        v-if="isVisible"
        :class="['loader-overlay', { 'fade-out': isHiding }]"
    >
      <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>

      <div class="loader-container">
        <div class="glow-ring"></div>
        <div class="wave-ring"></div>
        <div class="wave-ring"></div>

        <div class="stars">
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
          <div class="star"></div>
        </div>

        <div class="capybaraloader">
          <div class="capybara">
            <div class="capyhead">
              <div class="capyear">
                <div class="capyear2"></div>
              </div>
              <div class="capyear">
                <div class="capyear2"></div>
              </div>
              <div class="capyeye"></div>
              <div class="capyeye"></div>
              <div class="capymouth">
                <div class="capylips"></div>
                <div class="capylips"></div>
              </div>
            </div>
            <div class="capy">
              <div class="capyleg"></div>
              <div class="capyleg2"></div>
              <div class="capyleg2"></div>
            </div>
          </div>
          <div class="loader">
            <div class="loaderline"></div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['loaded'])

const isVisible = ref(true)
const isHiding = ref(false)
const minimumLoadTime = 1000 // минимальное время показа лоадера
const hideDelay = 3000 // время ожидания перед скрытием после загрузки

let loadStartTime = Date.now()
let allResourcesLoaded = false
let hideTimeout = null

const checkAllResourcesLoaded = () => {
  const images = document.querySelectorAll('img')
  const videos = document.querySelectorAll('video')
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')

  let loadedCount = 0
  const totalResources = images.length + videos.length + stylesheets.length

  if (totalResources === 0) {
    return true
  }

  images.forEach(img => {
    if (img.complete && img.naturalHeight !== 0) {
      loadedCount++
    }
  })

  videos.forEach(video => {
    if (video.readyState >= 3) {
      loadedCount++
    }
  })

  stylesheets.forEach(link => {
    if (link.sheet) {
      loadedCount++
    }
  })

  return loadedCount >= totalResources
}

const hideLoader = () => {
  const elapsedTime = Date.now() - loadStartTime
  const remainingTime = Math.max(0, minimumLoadTime - elapsedTime)

  setTimeout(() => {
    isHiding.value = true

    setTimeout(() => {
      isVisible.value = false
      emit('loaded')
    }, 1000)
  }, remainingTime)
}

const startLoadCheck = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLoadCheck)
    return
  }

  const checkResources = () => {
    if (checkAllResourcesLoaded()) {
      allResourcesLoaded = true

      hideTimeout = setTimeout(hideLoader, hideDelay)
    } else {
      setTimeout(checkResources, 100)
    }
  }

  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!allResourcesLoaded) {
          allResourcesLoaded = true
          hideTimeout = setTimeout(hideLoader, hideDelay)
        }
      }, 500)
    }, { once: true })
  }

  checkResources()
}

onMounted(() => {
  startLoadCheck()
})

onUnmounted(() => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
})
</script>