import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
	theme: {
		preset: Aura,
	},
})
app.use(ToastService)

// Initialize auth before mounting so the router
// has the user state available on first load
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.init().then(() => app.mount('#app'))