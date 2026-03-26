<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-2">Welcome, {{ authStore.user?.user_metadata?.full_name }}</h1>
    <p class="text-gray-500">Your dashboard is coming soon.</p>
    <button
      @click="authStore.logout"
      class="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
    >
      Sign out
    </button>
  </div>
</template>