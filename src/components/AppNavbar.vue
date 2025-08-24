<template>
  <div class="navbar-neon-container" ref="neonContainer">
    <div class="white"></div>
    <div class="border"></div>
    <div class="darkBorderBg"></div>
    <div class="glow"></div>

    <nav class="navbar" ref="navbar">
      <div class="search-container" ref="searchContainer">
        <div class="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#d6d6e6"
               stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input type="text" class="search-input" :placeholder="$t('search.placeholder')">
        <div class="search-filter">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#d6d6e6"
               stroke-width="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h7"></path>
          </svg>
        </div>
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