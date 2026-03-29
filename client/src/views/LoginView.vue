<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'

const authStore = useAuthStore()
const error = ref<string | null>(null)
const loading = ref(false)

async function handleGoogleLogin() {
  error.value = null
  loading.value = true
  try {
    await authStore.loginWithGoogle()
    // Page will redirect to Google — no need to do anything after
  } catch (e) {
    error.value = 'Something went wrong. Please try again.'
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-surface flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-md">
      <template #title>
        <div class="text-center text-3xl font-semibold">Goal Tracker</div>
      </template>
      <template #subtitle>
        <div class="text-center">Track your personal growth, one goal at a time.</div>
      </template>
      <template #content>
        <div class="space-y-4">
          <Button
            @click="handleGoogleLogin"
            :loading="loading"
            label="Continue with Google"
            icon="pi pi-google"
            class="w-full"
            severity="contrast"
          />
          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        </div>
      </template>
    </Card>
  </div>
</template>