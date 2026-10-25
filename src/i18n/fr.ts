import type en from "./en";

const fr: typeof en = {
  language: { label: "Langue", fr: "Français", en: "English" },

  common: {
    cancel: "Annuler",
    create: "Créer",
    save: "Enregistrer",
    close: "Fermer",
    delete: "Supprimer",
    done: "Terminé",
    name: "Nom",
    price: "Prix",
    cost: "Coût",
    margin: "Marge",
    coefficient: "Coefficient",
    amount: "Montant",
    frequency: "Fréquence",
    active: "Active",
    inactive: "Inactive",
    offline: "Hors ligne",
    today: "Aujourd'hui",
  },

  validation: {
    required: "Obligatoire.",
    positive: "Doit être positif.",
    aboveZero: "Doit être supérieur à 0.",
    wholeAboveZero: "Doit être un nombre entier supérieur à 0.",
    percentage: "Entre 0 et 100.",
    minPassword: "8 caractères minimum.",
  },

  count: {
    orders: "{n} commande | {n} commandes",
    shifts: "{n} shift | {n} shifts",
    dish: "{n} plat | {n} plats",
  },

  units: { KG: "kg", L: "l", UNIT: "pièce" },
  baseUnits: { KG: "g", L: "ml", UNIT: "pc" },
  frequencies: {
    PER_SHIFT: "par shift",
    MONTHLY: "mensuelle",
    YEARLY: "annuelle",
  },
  statuses: { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminée" },

  layout: {
    restaurants: "Restaurants",
    newRestaurant: "Nouveau restaurant",
    startShift: "Démarrer le shift",
    resumeShift: "Reprendre le shift",
    sync: "Synchroniser",
    fontSize: "Taille du texte",
    fontSmall: "Petite",
    fontMedium: "Moyenne",
    fontLarge: "Grande",
    logout: "Se déconnecter",
  },

  login: {
    username: "Identifiant",
    password: "Mot de passe",
    submit: "Se connecter",
    invalid: "Identifiant ou mot de passe incorrect.",
  },

  home: {
    title: "Aucun restaurant sélectionné",
    hint: "Choisissez un restaurant ou créez-en un.",
  },

  restaurant: {
    newTitle: "Nouveau restaurant",
    createError: "Impossible de créer le restaurant. Vérifiez la connexion.",
    tabs: {
      ingredients: "Ingrédients",
      recipes: "Recettes",
      accounting: "Comptabilité",
      settings: "Réglages",
    },
  },

  ingredients: {
    title: "Ingrédients",
    new: "Nouvel ingrédient",
    edit: "Modifier l'ingrédient",
    offline: "Hors ligne : les ingrédients sont en lecture seule.",
    empty: "Aucun ingrédient",
    soldBy: "Vendu au",
    extra: "Supplément",
    pricePer: "{price} / {unit}",
    paidExtra: "Disponible en supplément payant",
    extraPrice: "Prix du supplément",
    extraPortion: "Portion du supplément",
    saveError: "Impossible d'enregistrer l'ingrédient. Vérifiez la connexion.",
    deleteTitle: "Supprimer {name} ?",
    usedInRecipes:
      "Utilisé dans ces recettes, retirez-le d'abord de chacune d'elles :",
    usedInOrders:
      "Utilisé dans des commandes passées : il ne peut pas être supprimé.",
    deleteError: "Impossible de supprimer l'ingrédient. Vérifiez la connexion.",
  },

  recipes: {
    title: "Recettes",
    new: "Nouvelle recette",
    edit: "Modifier la recette",
    offline: "Hors ligne : les recettes sont en lecture seule.",
    empty: "Aucune recette",
    noIngredient: "Ajoutez d'abord des ingrédients dans l'onglet Ingrédients.",
    filter: "Filtrer les ingrédients",
    ingredient: "Ingrédient",
    quantity: "Quantité",
    saveError: "Impossible d'enregistrer la recette. Vérifiez la connexion.",
  },

  settings: {
    offline: "Hors ligne : les réglages sont en lecture seule.",
    restaurant: "Restaurant",
    vatRate: "Taux de TVA",
    saveError: "Impossible d'enregistrer le restaurant. Vérifiez la connexion.",
    dangerZone: "Zone de danger",
    dangerHint: "La suppression du restaurant est définitive.",
    deleteRestaurant: "Supprimer le restaurant",
  },

  fixedCharges: {
    title: "Charges fixes",
    new: "Nouvelle charge fixe",
    edit: "Modifier la charge fixe",
    onlineOnly: "Les charges fixes ne sont disponibles qu'en ligne",
    loadError: "Impossible de charger les charges fixes.",
    empty: "Aucune charge fixe",
    since: "Depuis le",
    appliesFrom: "S'applique à partir du",
    newAmountFrom: "Nouveau montant à partir du",
    revisionHint: "Le montant actuel reste en comptabilité jusqu'à la veille.",
    stopTitle: "Arrêter {name} ?",
    stopHint: "La charge reste en comptabilité jusqu'à ce jour inclus.",
    lastDay: "Dernier jour",
    stop: "Arrêter",
    afterStart: "Doit être postérieure au début de la charge ({date}).",
    notBeforeStart: "Ne peut pas précéder le début de la charge ({date}).",
    alreadyClosed: "Cette charge est déjà arrêtée.",
    saveError:
      "Impossible d'enregistrer la charge fixe. Vérifiez la connexion.",
    stopError: "Impossible d'arrêter la charge. Vérifiez la connexion.",
  },

  deleteRestaurant: {
    title: "Supprimer {name} ?",
    hint: "Ses shifts, commandes, recettes, ingrédients et charges fixes sont supprimés définitivement, sur le serveur et sur cet appareil.",
    unsynced:
      "{n} shift de ce restaurant n'est pas synchronisé : il sera perdu. | {n} shifts de ce restaurant ne sont pas synchronisés : ils seront perdus.",
    confirm: "Tapez « {name} » pour confirmer",
    error: "Impossible de supprimer le restaurant. Vérifiez la connexion.",
  },

  accounting: {
    title: "Comptabilité",
    year: "Année",
    month: "Mois",
    week: "Semaine",
    unsynced:
      "{n} shift non synchronisé n'est pas inclus. Synchronisez pour le compter. | {n} shifts non synchronisés ne sont pas inclus. Synchronisez pour les compter.",
    onlineOnly: "La comptabilité n'est disponible qu'en ligne",
    loadError: "Impossible de charger la comptabilité. Vérifiez la connexion.",
    toDate: "À date",
    wholeYear: "Année complète, charges fixes à venir comprises",
    shift: "Shift",
    current: "en cours",
    withoutShift: "Charges sans shift",
    noShift: "Aucun shift sur cette période.",
    revenueExclVat: "CA HT",
    inclVat: "{price} TTC",
    materialCost: "Coût matière",
    fixedCharges: "Charges fixes",
    profit: "Bénéfice",
    shiftOf: "Shift du {date}",
    pickUp: "Retrait",
    customer: "Client",
    notCounted: "non terminée · non comptée",
    shiftLoadError: "Impossible de charger le shift. Vérifiez la connexion.",
  },

  shift: {
    back: "Retour au restaurant (le shift reste ouvert)",
    since: "depuis {time}",
    end: "Terminer le shift",
    endTitle: "Terminer le shift ?",
    endHint:
      "Une fois terminé, le shift n'est plus modifiable et peut être synchronisé.",
    unfinished:
      "{n} commande n'est pas terminée : elle ne sera pas comptée en comptabilité. | {n} commandes ne sont pas terminées : elles ne seront pas comptées en comptabilité.",
    endAsIs: "Terminer tel quel",
    markAllDone: "Tout passer en terminé et finir",
  },

  orders: {
    new: "Nouvelle commande",
    edit: "Modifier la commande",
    none: "Aucune commande",
    selectRecipes: "Choisissez les recettes à ajouter à la commande",
    cart: "Panier",
    info: "Informations",
    customerName: "Nom du client",
    pickingTime: "Heure de retrait",
    toggleIngredients: "Cochez les ingrédients à ajouter ou retirer",
    start: "Lancer",
    pickingAt: "Retrait à {time}",
    noRecipe: "Aucune recette.",
    total: "Total",
    deleteTitle: "Supprimer la commande ?",
    deleteConfirm:
      "La commande de {name} sera supprimée définitivement. Cette action est irréversible.",
  },
};

export default fr;
