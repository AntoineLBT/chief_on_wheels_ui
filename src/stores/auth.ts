import api from "@/services/apiClient";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref<string | null>(localStorage.getItem("access_token"));
  const refreshToken = ref<string | null>(
    localStorage.getItem("refresh_token"),
  );

  const isAuthenticated = computed(() => accessToken.value !== null);

  async function login(username: string, password: string) {
    const response = await api.post("/auth/login/", {
      username,
      password,
    });

    accessToken.value = response.data.access;
    refreshToken.value = response.data.refresh;

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  return { accessToken, refreshToken, isAuthenticated, login, logout };
});
