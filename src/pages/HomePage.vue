<template>
  <AppLayout>
    <v-container>
      <v-card class="text-center pa-8" variant="outlined">
        <v-icon icon="mdi-store-outline" size="64" class="mb-4"></v-icon>
        <div class="text-h6">{{ t("home.title") }}</div>
        <div class="text-medium-emphasis">{{ t("home.hint") }}</div>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/components/AppLayout.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>
