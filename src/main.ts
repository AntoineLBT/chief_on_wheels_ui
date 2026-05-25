/// <reference types="vite/client" />
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { createRouter, createWebHistory } from 'vue-router'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'

  const vuetify = createVuetify({ theme: { defaultTheme: 'light' } })

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: () => import('@/pages/HomePage.vue') },
    ],
  })

  const app = createApp(App)
  app.use(createPinia())
  app.use(vuetify)
  app.use(router)
  app.mount('#app')