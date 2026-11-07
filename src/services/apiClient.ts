import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const REFRESH_URL = "/auth/refresh/";

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  // No Authorization on the refresh call: DRF rejects an expired Bearer even
  // on an AllowAny view, which would make the refresh fail too.
  if (token && config.url !== REFRESH_URL) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Shared by every request that hits a 401 while a refresh is in flight (the
// cache load fires several in parallel): one refresh call, not one each.
let pendingRefresh: Promise<void> | null = null;

let authFailureHandler: () => void = () => {};

/**
 * Called once when the refresh token is rejected (expired after 90 days):
 * the app logs out and goes to the login page. Unsynced shifts stay in Dexie.
 * Registered by main.ts, which owns the router.
 */
export function onAuthFailure(handler: () => void) {
  authFailureHandler = handler;
}

function refreshAccessToken() {
  pendingRefresh ??= api
    .post(REFRESH_URL, { refresh: localStorage.getItem("refresh_token") })
    .then(
      (response) => {
        localStorage.setItem("access_token", response.data.access);
      },
      (error: AxiosError) => {
        // Only a rejected refresh token ends the session; a network failure
        // (tablet offline) must not log out.
        if (error.response?.status === 401) authFailureHandler();
        throw error;
      },
    )
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}

// The access token lives 5 minutes in production: on a 401, refresh it once
// and replay the request, so callers never see the expiry.
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  if (
    error.response?.status !== 401 ||
    !config ||
    config._retried ||
    config.url === REFRESH_URL
  ) {
    throw error;
  }
  config._retried = true;
  await refreshAccessToken();
  return api(config);
});

export default api;
