// English catalogue: the reference for the shape of fr.ts.
export default {
  language: { label: "Language", fr: "Français", en: "English" },

  common: {
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    close: "Close",
    delete: "Delete",
    done: "Done",
    name: "Name",
    price: "Price",
    cost: "Cost",
    margin: "Margin",
    coefficient: "Coefficient",
    amount: "Amount",
    frequency: "Frequency",
    active: "Active",
    inactive: "Inactive",
    offline: "Offline",
    today: "Today",
  },

  validation: {
    required: "Required.",
    positive: "Must be positive.",
    aboveZero: "Must be above 0.",
    wholeAboveZero: "Must be a whole number above 0.",
    percentage: "Between 0 and 100.",
    minPassword: "Min 8 characters.",
  },

  count: {
    orders: "{n} order | {n} orders",
    shifts: "{n} shift | {n} shifts",
    pizzas: "{n} pizza | {n} pizzas",
  },

  units: { KG: "kg", L: "l", UNIT: "piece" },
  baseUnits: { KG: "g", L: "ml", UNIT: "pc" },
  frequencies: {
    PER_SHIFT: "per shift",
    MONTHLY: "monthly",
    YEARLY: "yearly",
  },
  statuses: { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" },

  layout: {
    restaurants: "Restaurants",
    newRestaurant: "New restaurant",
    startShift: "Start shift",
    resumeShift: "Resume shift",
    sync: "Sync",
    fontSize: "Font size",
    fontSmall: "Small",
    fontMedium: "Medium",
    fontLarge: "Large",
    logout: "Logout",
  },

  login: {
    username: "Username",
    password: "Enter your password",
    submit: "Log in",
    invalid: "Invalid username or password.",
  },

  home: {
    title: "No restaurant selected",
    hint: "Select a restaurant or create a new one.",
  },

  restaurant: {
    newTitle: "New restaurant",
    createError: "Could not create the restaurant. Check your connection.",
    tabs: {
      ingredients: "Ingredients",
      recipes: "Recipes",
      accounting: "Accounting",
      settings: "Settings",
    },
  },

  ingredients: {
    title: "Ingredients",
    new: "New ingredient",
    edit: "Edit ingredient",
    offline: "Offline: ingredients are read-only.",
    empty: "No ingredient yet",
    soldBy: "Sold by",
    extra: "Extra",
    pricePer: "{price} / {unit}",
    paidExtra: "Available as a paid extra",
    extraPrice: "Extra price",
    extraPortion: "Extra portion",
    saveError: "Could not save the ingredient. Check your connection.",
    deleteTitle: "Delete {name}?",
    usedInRecipes: "Used in these recipes, remove it from them first:",
    usedInOrders: "Used in past orders: it cannot be deleted.",
    deleteError: "Could not delete the ingredient. Check your connection.",
  },

  recipes: {
    title: "Recipes",
    new: "New recipe",
    edit: "Edit recipe",
    offline: "Offline: recipes are read-only.",
    empty: "No recipe yet",
    noIngredient: "Add ingredients in the Ingredients tab first.",
    filter: "Filter ingredients",
    ingredient: "Ingredient",
    quantity: "Quantity",
    saveError: "Could not save the recipe. Check your connection.",
  },

  settings: {
    offline: "Offline: settings are read-only.",
    restaurant: "Restaurant",
    vatRate: "VAT rate",
    saveError: "Could not save the restaurant. Check your connection.",
    dangerZone: "Danger zone",
    dangerHint: "Deleting the restaurant cannot be undone.",
    deleteRestaurant: "Delete restaurant",
  },

  fixedCharges: {
    title: "Fixed charges",
    new: "New fixed charge",
    edit: "Edit fixed charge",
    onlineOnly: "Fixed charges are only available online",
    loadError: "Could not load the fixed charges.",
    empty: "No fixed charge yet",
    since: "Since",
    appliesFrom: "Applies from",
    newAmountFrom: "New amount applies from",
    revisionHint:
      "The current amount stays in the accounting until the day before.",
    stopTitle: "Stop {name}?",
    stopHint:
      "The charge stays in the accounting up to and including this day.",
    lastDay: "Last day",
    stop: "Stop",
    afterStart: "Must be after the start of the charge ({date}).",
    notBeforeStart: "Must not be before the start of the charge ({date}).",
    alreadyClosed: "This charge is already closed.",
    saveError: "Could not save the fixed charge. Check your connection.",
    stopError: "Could not stop the charge. Check your connection.",
  },

  deleteRestaurant: {
    title: "Delete {name}?",
    hint: "Its shifts, orders, recipes, ingredients and fixed charges are deleted for good, on the server and on this device.",
    unsynced:
      "{n} shift of this restaurant is not synced: it will be lost. | {n} shifts of this restaurant are not synced: they will be lost.",
    confirm: "Type “{name}” to confirm",
    error: "Could not delete the restaurant. Check your connection.",
  },

  accounting: {
    title: "Accounting",
    year: "Year",
    month: "Month",
    week: "Week",
    unsynced:
      "{n} unsynced shift is not included. Sync to count it. | {n} unsynced shifts are not included. Sync to count them.",
    onlineOnly: "Accounting is only available online",
    loadError: "Could not load the accounting. Check your connection.",
    toDate: "To date",
    wholeYear: "Whole year, upcoming fixed charges included",
    shift: "Shift",
    current: "current",
    withoutShift: "Charges without shift",
    noShift: "No shift in this period.",
    revenueExclVat: "Revenue excl. VAT",
    inclVat: "{price} incl. VAT",
    materialCost: "Material cost",
    fixedCharges: "Fixed charges",
    profit: "Profit",
    shiftOf: "Shift of {date}",
    pickUp: "Pick-up",
    customer: "Customer",
    notCounted: "not done · not counted",
    shiftLoadError: "Could not load the shift. Check your connection.",
  },

  shift: {
    back: "Back to the restaurant (the shift stays open)",
    since: "since {time}",
    end: "End shift",
    endTitle: "End the shift?",
    endHint:
      "Once ended, the shift can no longer be changed and is ready to sync.",
    unfinished:
      "{n} order is not done: it will not count in the accounting. | {n} orders are not done: they will not count in the accounting.",
    endAsIs: "End as is",
    markAllDone: "Mark all done and end",
  },

  orders: {
    new: "New order",
    edit: "Edit order",
    none: "No orders",
    selectRecipes: "Select recipes to add to the order",
    cart: "Cart",
    info: "Order info",
    customerName: "Customer name",
    pickingTime: "Picking time",
    toggleIngredients: "Toggle ingredients to add or remove",
    start: "Start",
    pickingAt: "Picking at {time}",
    noRecipe: "No recipes.",
    total: "Total",
    deleteTitle: "Delete order?",
    deleteConfirm:
      "This will permanently delete the order for {name}. This cannot be undone.",
  },
};
