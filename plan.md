# UI changes plan

## 1. Project setup

- [x] Wire Vuetify into `main.ts` (createVuetify, app.use)
- [x] Wire Vue Router into `main.ts` with a stub home route
- [x] Add ESLint + Prettier (`@vue/eslint-config-prettier`, `eslint-plugin-vue`)
- [x] Configure `@` path alias in `vite.config.ts` and `tsconfig.app.json`
- [x] Add `VITE_API_BASE_URL` to `.env` and `.env.example`
- [x] Install Dexie, axios, vite-plugin-pwa

## 2. Auth

- [x] Create `src/services/apiClient.ts` — axios instance reading `VITE_API_BASE_URL`, request interceptor injects `Authorization: Bearer <token>`, response interceptor calls `/auth/refresh/` on 401 and retries once
- [x] Create `src/stores/auth.ts` — Pinia store holding `accessToken`, `refreshToken` (persisted to localStorage), `login()`, `logout()`, `isAuthenticated` getter
- [x] Create `LoginPage.vue` — email + password form, calls store `login()`, redirects to home on success
- [x] Add router guard: unauthenticated users redirected to `/login`

## 3. Dexie schema

- [x] Create `src/services/db.ts` — Dexie subclass with version 1 schema:
  - `restaurants`: `pk, name, type`
  - `recipes`: `pk, restaurant, name, price`
  - `recipe_ingredients`: `pk, recipe, ingredient, quantity_in_g`
  - `ingredients`: `pk, restaurant, name, price_by_kg`
  - `shifts`: `pk, restaurant, date, ended_at, is_synced`
  - `orders`: `pk, shift, customer_name, picking_time, status, is_synced`
  - `order_recipes`: `pk, order, recipe, is_synced`
  - `order_ingredients`: `pk, order_recipe, ingredient, action_type, is_synced`
- [ ] xAdd `src/services/seed.ts` — helper to populate Dexie with dev fixture data (one restaurant, a few recipes and ingredients) so the app is usable without a live API

## 4. Cache layer (API → Dexie on load)

- [x] Create `src/services/cacheService.ts` — fetches `/restaurants/`, `/restaurants/{id}/recipes/`, and ingredients from the API, upserts into Dexie
- [x] Call `cacheService.load()` in `App.vue` `onMounted` (guard: only when authenticated and online)
- [x] Create `src/stores/restaurant.ts` — Pinia store loading restaurants from Dexie, exposes `current` (selected restaurant)

## 5. Shift management

- [ ] Create `src/stores/shift.ts` — loads shifts from Dexie filtered by current restaurant, `createShift()` writes to Dexie with `is_synced = false`, `endShift()` sets `ended_at`
- [ ] Create `ShiftListPage.vue` — lists shifts for current restaurant, button to start a new shift, navigates into a shift
- [ ] Create `ShiftPage.vue` — shell for the active shift, hosts the kanban board

## 6. Kanban board

- [ ] Create `src/stores/order.ts` — loads orders for current shift from Dexie, `createOrder()`, `updateStatus()` writes delta back to Dexie
- [ ] Create `KanbanBoard.vue` — three columns (TODO / IN_PROGRESS / DONE), renders `OrderCard` components, drag-and-drop or arrow buttons to transition status
- [ ] Create `OrderCard.vue` — displays customer name, picking time, recipe list, total amount

## 7. Order creation flow

- [ ] Create `NewOrderDialog.vue` — customer name + picking time inputs, recipe multi-select (from Dexie), confirm writes order + order_recipes to Dexie
- [ ] Create `IngredientCustomizationDialog.vue` — per-recipe ingredient toggle list (ADD / REMOVE delta), writes order_ingredients to Dexie
- [ ] Wire both dialogs into `ShiftPage.vue`

## 8. Sync

- [ ] Create `src/services/syncService.ts` — queries Dexie for `is_synced = false` shifts (with nested orders/order_recipes/order_ingredients), POSTs to `/sync/`, marks records `is_synced = true` on success
- [ ] Create `src/stores/sync.ts` — exposes `pendingCount` (unsynced shift count), `isSyncing`, `sync()`
- [ ] Add a sync button in the app bar showing `pendingCount`, disabled when offline or already syncing

## 9. PWA shell + offline validation

- [ ] Configure `vite-plugin-pwa` in `vite.config.ts` — manifest (name, icons, `display: standalone`, `theme_color`), Workbox `GenerateSW` with `networkFirst` for API calls and `cacheFirst` for static assets
- [ ] Add `src/composables/useOnlineStatus.ts` — wraps `navigator.onLine` + `online`/`offline` events, returns reactive `isOnline`
- [ ] Show offline banner in `App.vue` when `!isOnline`
- [ ] Validate full offline flow: load app, disable network, create a shift + orders, re-enable network, sync

## 10. Thermal printer

- [ ] Research and choose transport: BLE (Web Bluetooth API) or WiFi (local HTTP) based on target printer model (Epson TM-m30II or Star mC-Print2)
- [ ] Create `src/services/printerService.ts` — `connect()`, `printTicket(order)` generating ESC/POS or StarPRNT commands
- [ ] Trigger `printTicket()` on `TODO → IN_PROGRESS` transition in `src/stores/order.ts`
- [ ] Add printer settings page: connect/disconnect, test print
