import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import i18n from './i18n.js'

import './assets/styles/base.css'
import './assets/styles/navbar.css'
import './assets/styles/navbar-neon.css'
import './assets/styles/loader.css'
import './assets/styles/mywork-layout.css'
import './assets/styles/skeleton.css'
import './assets/styles/video-card.css'

const app = createApp(App)

if (sessionStorage.redirect) {
    const redirect = sessionStorage.redirect
    delete sessionStorage.redirect
    router.push(redirect)
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')