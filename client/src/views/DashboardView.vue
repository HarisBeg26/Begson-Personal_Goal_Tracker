<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useGoalsStore } from "../stores/goals";

const authStore = useAuthStore();
const goalsStore = useGoalsStore();

const title = ref("");
const description = ref("");
const actionPlan = ref("");
const metricLabel = ref("");
const metricTarget = ref<string>("");
const metricUnit = ref("");
const startDate = ref("");
const targetDate = ref("");

const isSpecific = ref(false);
const isMeasurable = ref(false);
const isRealistic = ref(false);
const isPositive = ref(false);
const isPersonal = ref(false);
const isAligned = ref(false);

const createLoading = ref(false);
const createError = ref<string | null>(null);

onMounted(() => {
  void goalsStore.fetchGoals();
});

async function handleCreateGoal() {
  createError.value = null;

  if (!title.value.trim()) {
    createError.value = "Title is required";
    return;
  }

  if (!targetDate.value) {
    createError.value = "Target date is required";
    return;
  }

  createLoading.value = true;

  try {
    await goalsStore.createGoal({
      title: title.value.trim(),
      description: description.value || null,
      action_plan: actionPlan.value || null,
      is_specific: isSpecific.value,
      is_measurable: isMeasurable.value,
      is_realistic: isRealistic.value,
      is_positive: isPositive.value,
      is_personal: isPersonal.value,
      is_aligned: isAligned.value,
      metric_label: metricLabel.value || null,
      metric_target: metricTarget.value ? Number(metricTarget.value) : null,
      metric_unit: metricUnit.value || null,
      start_date: startDate.value || null,
      target_date: targetDate.value,
      status: "active",
    });

    title.value = "";
    description.value = "";
    actionPlan.value = "";
    metricLabel.value = "";
    metricTarget.value = "";
    metricUnit.value = "";
    startDate.value = "";
    targetDate.value = "";
    isSpecific.value = false;
    isMeasurable.value = false;
    isRealistic.value = false;
    isPositive.value = false;
    isPersonal.value = false;
    isAligned.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : "Failed to create goal";
  } finally {
    createLoading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl p-6 space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Welcome, {{ authStore.user?.user_metadata?.full_name || "User" }}
        </h1>
        <p class="text-gray-600">Personal development dashboard</p>
      </div>
      <button
        @click="authStore.logout"
        class="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
      >
        Sign out
      </button>
    </header>

    <section class="rounded-xl border bg-white p-5 space-y-4">
      <h2 class="text-lg font-semibold">Create Goal</h2>

      <input
        v-model="title"
        type="text"
        placeholder="Goal title"
        class="w-full rounded-lg border px-3 py-2"
      />

      <textarea
        v-model="description"
        rows="2"
        placeholder="Description"
        class="w-full rounded-lg border px-3 py-2"
      />

      <textarea
        v-model="actionPlan"
        rows="3"
        placeholder="Action plan"
        class="w-full rounded-lg border px-3 py-2"
      />

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          v-model="metricLabel"
          type="text"
          placeholder="Metric label (pages)"
          class="rounded-lg border px-3 py-2"
        />
        <input
          v-model="metricTarget"
          type="number"
          min="0"
          step="0.01"
          placeholder="Metric target"
          class="rounded-lg border px-3 py-2"
        />
        <input
          v-model="metricUnit"
          type="text"
          placeholder="Metric unit (pages/day)"
          class="rounded-lg border px-3 py-2"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm text-gray-600">Start date</label>
          <input v-model="startDate" type="date" class="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600">Target date</label>
          <input v-model="targetDate" type="date" class="w-full rounded-lg border px-3 py-2" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <label class="flex items-center gap-2"><input v-model="isSpecific" type="checkbox" /> Specific</label>
        <label class="flex items-center gap-2"><input v-model="isMeasurable" type="checkbox" /> Measurable</label>
        <label class="flex items-center gap-2"><input v-model="isRealistic" type="checkbox" /> Realistic</label>
        <label class="flex items-center gap-2"><input v-model="isPositive" type="checkbox" /> Positive</label>
        <label class="flex items-center gap-2"><input v-model="isPersonal" type="checkbox" /> Personal</label>
        <label class="flex items-center gap-2"><input v-model="isAligned" type="checkbox" /> Aligned</label>
      </div>

      <button
        @click="handleCreateGoal"
        :disabled="createLoading"
        class="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {{ createLoading ? "Saving..." : "Save Goal" }}
      </button>

      <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
      <p v-if="goalsStore.error" class="text-sm text-red-600">{{ goalsStore.error }}</p>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">My Goals</h2>

      <p v-if="goalsStore.loading" class="text-gray-600">Loading goals...</p>
      <p v-else-if="goalsStore.goals.length === 0" class="text-gray-600">No goals yet.</p>

      <div v-else class="grid gap-3">
        <article
          v-for="goal in goalsStore.goals"
          :key="goal.id"
          class="rounded-xl border bg-white p-4"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{{ goal.title }}</h3>
            <span class="text-sm text-gray-500">{{ goal.status }}</span>
          </div>
          <p v-if="goal.description" class="mt-1 text-sm text-gray-700">{{ goal.description }}</p>
          <p v-if="goal.action_plan" class="mt-1 text-sm text-gray-600">{{ goal.action_plan }}</p>
          <p class="mt-2 text-sm text-gray-600">
            {{ goal.start_date }} -> {{ goal.target_date }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>