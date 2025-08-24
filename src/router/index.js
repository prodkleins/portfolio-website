import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/HomeView.vue')
    },
    {
        path: '/mywork',
        name: 'mywork',
        component: () => import('../views/MyWorkView.vue')
    },
    {
        path: '/contact',
        name: 'contact',
        component: () => import('../views/ContactView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(process.env.NODE_ENV === 'production' ? '/' : '/'),
    routes
})

export default router