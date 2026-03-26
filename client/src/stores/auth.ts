import { defineStore } from "pinia";
import {ref, computed} from "vue";
import { supabase } from "../lib/supabase";
import type {User, Session } from "@supabase/supabase-js";

export const useAuthStore = defineStore("auth", () => {
    const user = ref<User | null>(null);
    const session = ref<Session | null>(null);
    const loading = ref(true)

    const isAuthenticated = computed(() => !!user.value)

    async function init() {
        loading.value = true;

        const { data } = await supabase.auth.getSession()
        session.value = data.session;
        user.value = data.session?.user ?? null

        supabase.auth.onAuthStateChange((_event, newSession) => {
            session.value = newSession
            user.value = newSession?.user ?? null
            loading.value = false
        })

        loading.value = false
    }

    async function loginWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }

    async function logout() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        user.value = null
        session.value = null
    }

    function getAccessToken(): string | null {
        return session.value?.access_token ?? null
    }

    return { user, session, loading, isAuthenticated, init, loginWithGoogle, logout, getAccessToken }
})