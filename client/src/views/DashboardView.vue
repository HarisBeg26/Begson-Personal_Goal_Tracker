<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useGoalsStore } from "../stores/goals";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import DatePicker from "primevue/datepicker";
import Checkbox from "primevue/checkbox";
import InputNumber from "primevue/inputnumber";
import Message from "primevue/message";
import Card from "primevue/card";
import Tag from "primevue/tag";

const authStore = useAuthStore();
const goalsStore = useGoalsStore();

const title = ref("");
const description = ref("");
const actionPlan = ref("");
const metricLabel = ref("");
const metricTarget = ref<number | null>(null);
const metricUnit = ref("");
const startDate = ref<Date | null>(null);
const targetDate = ref<Date | null>(null);

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

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusSeverity(status: string): "success" | "warn" | "danger" | "contrast" {
  if (status === "completed") return "success";
  if (status === "paused") return "warn";
  if (status === "cancelled") return "danger";
  return "contrast";
}

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
      metric_target: metricTarget.value,
      metric_unit: metricUnit.value || null,
      start_date: startDate.value ? formatDate(startDate.value) : null,
      target_date: formatDate(targetDate.value),
      status: "active",
    });

    title.value = "";
    description.value = "";
    actionPlan.value = "";
    metricLabel.value = "";
    metricTarget.value = null;
    metricUnit.value = "";
    startDate.value = null;
    targetDate.value = null;
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
      <Button
        @click="authStore.logout"
        icon="pi pi-sign-out"
        label="Sign out"
        severity="danger"
        outlined
      />
    </header>

    <Card>
      <template #title>Create Goal</template>
      <template #content>
        <div class="space-y-4">
          <InputText
            v-model="title"
            placeholder="Goal title"
            class="w-full"
          />

          <Textarea
            v-model="description"
            rows="2"
            placeholder="Description"
            class="w-full"
            autoResize
          />

          <Textarea
            v-model="actionPlan"
            rows="3"
            placeholder="Action plan"
            class="w-full"
            autoResize
          />

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <InputText
              v-model="metricLabel"
              placeholder="Metric label (pages)"
            />
            <InputNumber
              v-model="metricTarget"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              placeholder="Metric target"
            />
            <InputText
              v-model="metricUnit"
              placeholder="Metric unit (pages/day)"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="space-y-1">
              <label class="text-sm text-gray-600">Start date</label>
              <DatePicker
                v-model="startDate"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                class="w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm text-gray-600">Target date</label>
              <DatePicker
                v-model="targetDate"
                dateFormat="yy-mm-dd"
                showIcon
                iconDisplay="input"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
            <label class="flex items-center gap-2"><Checkbox v-model="isSpecific" binary /> Specific</label>
            <label class="flex items-center gap-2"><Checkbox v-model="isMeasurable" binary /> Measurable</label>
            <label class="flex items-center gap-2"><Checkbox v-model="isRealistic" binary /> Realistic</label>
            <label class="flex items-center gap-2"><Checkbox v-model="isPositive" binary /> Positive</label>
            <label class="flex items-center gap-2"><Checkbox v-model="isPersonal" binary /> Personal</label>
            <label class="flex items-center gap-2"><Checkbox v-model="isAligned" binary /> Aligned</label>
          </div>

          <Button
            @click="handleCreateGoal"
            :loading="createLoading"
            label="Save Goal"
            icon="pi pi-check"
          />

          <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
          <Message v-if="goalsStore.error" severity="error" :closable="false">{{ goalsStore.error }}</Message>
        </div>
      </template>
    </Card>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">My Goals</h2>

      <Message v-if="goalsStore.loading" severity="info" :closable="false">Loading goals...</Message>
      <Message v-else-if="goalsStore.goals.length === 0" severity="secondary" :closable="false">No goals yet.</Message>

      <div v-else class="grid gap-3">
        <Card
          v-for="goal in goalsStore.goals"
          :key="goal.id"
        >
          <template #title>
            <div class="flex items-center justify-between">
              <span>{{ goal.title }}</span>
              <Tag :severity="statusSeverity(goal.status)" :value="goal.status" />
            </div>
          </template>
          <template #content>
            <p v-if="goal.description" class="text-sm text-gray-700">{{ goal.description }}</p>
            <p v-if="goal.action_plan" class="mt-1 text-sm text-gray-600">{{ goal.action_plan }}</p>
            <p class="mt-2 text-sm text-gray-600">
              {{ goal.start_date }} -> {{ goal.target_date }}
            </p>
          </template>
        </Card>
      </div>
    </section>
  </div>
</template>