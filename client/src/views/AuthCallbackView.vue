<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

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
  <div class="auth-surface flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-md text-center">
      <template #title>Signing You In</template>
      <template #content>
        <div class="flex flex-col items-center gap-4">
          <ProgressSpinner style="width: 52px; height: 52px" strokeWidth="6" />
          <p class="text-gray-600">Finalizing your secure session...</p>
        </div>
      </template>
    </Card>
  </div>
</template>