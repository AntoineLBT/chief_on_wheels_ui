/// <reference types="vite/client" />
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { createRouter, createWebHistory } from "vue-router";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { db } from "./services/db";
import { useAuthStore } from "./stores/auth";
import { resolveShiftRoute } from "./stores/shift";

const vuetify = createVuetify({ theme: { defaultTheme: "light" } });

const LAST_RESTAURANT_KEY = "lastRestaurantPk";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/pages/HomePage.vue"),
      beforeEnter: async () => {
        const pk = localStorage.getItem(LAST_RESTAURANT_KEY);
        if (pk && (await db.restaurants.get(pk))) return `/restaurants/${pk}`;
      },
    },
    { path: "/login", component: () => import("@/pages/LoginPage.vue") },
    {
      path: "/restaurants/:restaurantId",
      component: () => import("@/pages/RestaurantPage.vue"),
      children: [
        { path: "", redirect: { name: "restaurant-ingredients" } },
        {
          path: "accounting",
          name: "restaurant-accounting",
          component: () => import("@/pages/restaurant/AccountingTab.vue"),
        },
        {
          path: "ingredients",
          name: "restaurant-ingredients",
          component: () => import("@/pages/restaurant/IngredientsTab.vue"),
        },
        {
          path: "recipes",
          name: "restaurant-recipes",
          component: () => import("@/pages/restaurant/RecipesTab.vue"),
        },
        {
          path: "settings",
          name: "restaurant-settings",
          component: () => import("@/pages/restaurant/SettingsTab.vue"),
        },
      ],
    },
    { path: "/shift", component: () => import("@/pages/ShiftListPage.vue") },
    {
      // Top-level: full screen, outside RestaurantPage and its sidebar.
      path: "/restaurants/:restaurantId/shifts/:shiftId",
      component: () => import("@/pages/ShiftPage.vue"),
      beforeEnter: (to) =>
        resolveShiftRoute(
          String(to.params.restaurantId),
          String(to.params.shiftId),
        ),
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (to.path !== "/login" && !authStore.isAuthenticated) {
    return "/login";
  }
  // Global guard rather than beforeEnter: beforeEnter does not re-run when only
  // the :restaurantId param changes (switching restaurant in the sidebar).
  const restaurantId = to.params.restaurantId;
  if (
    typeof restaurantId === "string" &&
    !(await db.restaurants.get(restaurantId))
  ) {
    localStorage.removeItem(LAST_RESTAURANT_KEY);
    return "/";
  }
});

router.afterEach((to) => {
  const restaurantId = to.params.restaurantId;
  if (typeof restaurantId === "string") {
    localStorage.setItem(LAST_RESTAURANT_KEY, restaurantId);
  }
});

const app = createApp(App);
app.use(createPinia());
app.use(vuetify);
app.use(router);
app.mount("#app");
