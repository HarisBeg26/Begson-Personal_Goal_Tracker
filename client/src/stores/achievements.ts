import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { apiFetch } from "../lib/api";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_key: string;
  points: number;
  created_at: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

interface AchievementsResponse {
  data: Achievement[];
}

export const useAchievementsStore = defineStore("achievements", () => {
  const items = ref<Achievement[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const hasLoaded = ref(false);

  const unlocked = computed(() => items.value.filter((achievement) => achievement.unlocked));
  const locked = computed(() => items.value.filter((achievement) => !achievement.unlocked));
  const percent = computed(() => {
    if (items.value.length === 0) return 0;
    return Math.round((unlocked.value.length / items.value.length) * 100);
  });

  async function fetchAchievements(options?: { detectNewUnlocks?: boolean }) {
    const detectNewUnlocks = options?.detectNewUnlocks ?? false;
    const previousUnlocked = new Set(items.value.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id));

    loading.value = true;
    error.value = null;

    try {
      const response = await apiFetch<AchievementsResponse>("/api/achievements");
      items.value = response.data;

      const newlyUnlocked = hasLoaded.value && detectNewUnlocks
        ? items.value.filter((achievement) => achievement.unlocked && !previousUnlocked.has(achievement.id))
        : [];

      hasLoaded.value = true;
      return newlyUnlocked;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load achievements";
      return [] as Achievement[];
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    error,
    unlocked,
    locked,
    percent,
    fetchAchievements,
  };
});
