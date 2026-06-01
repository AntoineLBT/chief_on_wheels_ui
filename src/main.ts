/// <reference types="vite/client" />
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { createRouter, createWebHistory } from "vue-router";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { useAuthStore } from "./stores/auth";

const vuetify = createVuetify({ theme: { defaultTheme: "light" } });

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("@/pages/HomePage.vue") },
    { path: "/login", component: () => import("@/pages/LoginPage.vue") },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.path !== "/login" && !authStore.isAuthenticated) {
    return "/login";
  }
});

const app = createApp(App);
app.use(createPinia());
app.use(vuetify);
app.use(router);
app.mount("#app");
