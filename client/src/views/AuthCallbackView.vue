<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()

onMounted(async () => {
  const url = new URL(window.location.href)
  const authCode = url.searchParams.get('code')
  const providerError = url.searchParams.get('error_description')

  if (providerError) {
    console.error('Auth callback provider error:', providerError)
    router.replace({ name: 'login' })
    return
  }

  // If session is already present (processed earlier), do not re-exchange PKCE code.
  const { data: existingSession } = await supabase.auth.getSession()

  if (!existingSession.session && authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

    if (error) {
      console.error('Auth callback error:', error)
      router.replace({ name: 'login' })
      return
    }
  }

  const { data: finalSession } = await supabase.auth.getSession()

  if (!finalSession.session) {
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