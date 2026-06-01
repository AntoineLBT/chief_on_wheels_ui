<template>
  <div>
    <v-img class="mx-auto my-6" max-width="500" :src="logo"></v-img>

    <v-card
      class="mx-auto pa-12 pb-8"
      elevation="3"
      max-width="448"
      rounded="lg"
    >
      <v-text-field
        v-model="username"
        density="compact"
        placeholder="Username"
        prepend-inner-icon="mdi-account-outline"
        variant="outlined"
        validate-on="blur"
        :rules="[rules.required]"
      ></v-text-field>

      <v-text-field
        v-model="password"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        :type="showPassword ? 'text' : 'password'"
        density="compact"
        placeholder="Enter your password"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        validate-on="blur"
        :rules="[rules.required, rules.min]"
        @click:append-inner="showPassword = !showPassword"
      ></v-text-field>

      <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

      <v-btn
        color="blue"
        size="large"
        variant="tonal"
        block
        @click="submitLogin"
      >
        Log In
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import logo from "@/assets/logo.png";

const showPassword = ref(false);
const authStore = useAuthStore();
const router = useRouter();

const rules = {
  required: (value: string) => !!value || "Required.",
  min: (v: string) => v.length >= 8 || "Min 8 characters",
};

const username = ref("");
const password = ref("");
const error = ref("");

async function submitLogin() {
  try {
    await authStore.login(username.value, password.value);
    router.push("/");
  } catch {
    error.value = "Invalid username or password";
  }
}
</script>
