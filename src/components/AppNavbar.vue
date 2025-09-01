<template>
  <div class="navbar-neon-container" ref="neonContainer">
    <div class="white"></div>
    <div class="border"></div>
    <div class="darkBorderBg"></div>
    <div class="glow"></div>

    <nav class="navbar" ref="navbar">
      <div class="developer-container" ref="developerContainer">
        <div class="developer-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#d6d6e6"
               stroke-width="2" viewBox="0 0 24 24">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <a href="https://t.me/aerthion" target="_blank" rel="noopener noreferrer" class="developer-link">
          developed by lxngren
        </a>
      </div>
      <div class="navbar-center">
        <div class="navbar-buttons">
          <router-link to="/" class="nav-button" :class="{ 'active-page': $route.name === 'home' }">
            {{ $t('navigation.home') }}
          </router-link>
          <router-link to="/mywork" class="nav-button" :class="{ 'active-page': $route.name === 'mywork' }">
            {{ $t('navigation.mywork') }}
          </router-link>
          <router-link to="/contact" class="nav-button" :class="{ 'active-page': $route.name === 'contact' }">
            {{ $t('navigation.contact') }}
          </router-link>
        </div>
      </div>
      <div class="navbar-lang-dropdown">
        <button class="lang-select" @click="toggleLocale">
          <img :src="currentFlag" :alt="locale" width="20" height="20">
        </button>
        <div class="lang-dropdown">
          <button class="lang-option" @click="toggleLocale">
            <img :src="alternativeFlag" :alt="alternativeLocale" width="20" height="20">
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { locale } = useI18n()

const flags = {
  en: '/assets/images/en-flag.svg',
  ru: '/assets/images/ru-flag.svg'
}

const alternativeLocale = computed(() => locale.value === 'en' ? 'ru' : 'en')
const currentFlag = computed(() => flags[locale.value])
const alternativeFlag = computed(() => flags[alternativeLocale.value])

function toggleLocale() {
  locale.value = (locale.value === 'en' ? 'ru' : 'en')
  try {
    localStorage.setItem('locale', locale.value)
  } catch {
  }
}
</script>