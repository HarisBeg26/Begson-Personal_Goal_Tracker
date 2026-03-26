<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

onMounted(async () => {
  // Supabase automatically picks up the OAuth code from the URL
  const { error } = await supabase.auth.exchangeCodeForSession(
    window.location.href
  )

  if (error) {
    console.error('Auth callback error:', error)
    router.replace({ name: 'login' })
    return
  }

  router.replace({ name: 'dashboard' })
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <p class="text-gray-500 text-lg">Signing you in...</p>
  </div>
</template>