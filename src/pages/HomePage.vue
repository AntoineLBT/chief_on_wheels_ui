<template>
  <AppLayout>
    <v-container>
      <v-card class="text-center pa-8" variant="outlined">
        <v-icon icon="mdi-store-outline" size="64" class="mb-4"></v-icon>
        <div class="text-h6">No restaurant selected</div>
        <div class="text-medium-emphasis">
          Select a restaurant or create a new one.
        </div>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/components/AppLayout.vue";
</script>
