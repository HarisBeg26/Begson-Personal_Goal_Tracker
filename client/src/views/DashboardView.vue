<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useGoalsStore } from "../stores/goals";
import { useAchievementsStore } from "../stores/achievements";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import DatePicker from "primevue/datepicker";
import Checkbox from "primevue/checkbox";
import InputNumber from "primevue/inputnumber";
import Message from "primevue/message";
import Card from "primevue/card";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
import ProgressBar from "primevue/progressbar";
import { useToast } from "primevue/usetoast";

const authStore = useAuthStore();
const goalsStore = useGoalsStore();
const achievementsStore = useAchievementsStore();
const toast = useToast();
const router = useRouter();
const activeSection = ref<"dashboard" | "achievements">("dashboard");
const createGoalDialogVisible = ref(false);
const editingGoalId = ref<string | null>(null);

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
  void achievementsStore.fetchAchievements();
});

const activeGoalsCount = computed(() => goalsStore.goals.filter((goal) => goal.status === "active").length);

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string): string {
  const parsed = parseDate(value);
  if (!parsed) return value;

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatGoalDateRange(start: string, end: string): string {
  return `From ${formatDisplayDate(start)} to ${formatDisplayDate(end)}`;
}

function statusSeverity(status: string): "success" | "warn" | "danger" | "info" {
  if (status === "completed") return "success";
  if (status === "paused") return "warn";
  if (status === "cancelled") return "danger";
  return "info";
}

const goalDialogHeader = computed(() => (editingGoalId.value ? "Edit Goal" : "Create New Goal"));
const goalDialogActionLabel = computed(() => (editingGoalId.value ? "Update Goal" : "Save Goal"));

function openCreateGoalDialog() {
  editingGoalId.value = null;
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
  createError.value = null;
  createGoalDialogVisible.value = true;
}

function openEditGoalDialog(goal: (typeof goalsStore.goals)[number]) {
  editingGoalId.value = goal.id;
  title.value = goal.title;
  description.value = goal.description ?? "";
  actionPlan.value = goal.action_plan ?? "";
  metricLabel.value = goal.metric_label ?? "";
  metricTarget.value = goal.metric_target;
  metricUnit.value = goal.metric_unit ?? "";
  startDate.value = parseDate(goal.start_date);
  targetDate.value = parseDate(goal.target_date);
  isSpecific.value = goal.is_specific;
  isMeasurable.value = goal.is_measurable;
  isRealistic.value = goal.is_realistic;
  isPositive.value = goal.is_positive;
  isPersonal.value = goal.is_personal;
  isAligned.value = goal.is_aligned;
  createError.value = null;
  createGoalDialogVisible.value = true;
}

function showUnlockedAchievementToasts(unlocked: { name: string; description: string }[]) {
  unlocked.forEach((achievement) => {
    toast.add({
      severity: "success",
      summary: `Achievement unlocked: ${achievement.name}`,
      detail: achievement.description,
      life: 3500,
    });
  });
}

async function handleSignOut() {
  try {
    await authStore.logout();
    await router.replace({ name: "login" });
  } catch {
    toast.add({
      severity: "error",
      summary: "Sign out failed",
      detail: "Please try again.",
      life: 3000,
    });
  }
}

async function handleSaveGoal() {
  createError.value = null;
  const isEditing = !!editingGoalId.value;

  if (!title.value.trim()) {
    createError.value = "Title is required";
    toast.add({ severity: "warn", summary: "Missing title", detail: createError.value, life: 2500 });
    return;
  }

  if (!targetDate.value) {
    createError.value = "Target date is required";
    toast.add({ severity: "warn", summary: "Missing target date", detail: createError.value, life: 2500 });
    return;
  }

  createLoading.value = true;

  try {
    const payload = {
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
    };

    if (editingGoalId.value) {
      await goalsStore.updateGoal(editingGoalId.value, payload);
    } else {
      await goalsStore.createGoal({
        ...payload,
        status: "active",
      });
    }

    editingGoalId.value = null;
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

    toast.add({
      severity: "success",
      summary: isEditing ? "Goal updated" : "Goal saved",
      detail: isEditing ? "Your goal has been updated." : "Your goal has been added to your dashboard.",
      life: 2500,
    });

    const newlyUnlocked = await achievementsStore.fetchAchievements({ detectNewUnlocks: true });
    showUnlockedAchievementToasts(newlyUnlocked);

    createGoalDialogVisible.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : "Failed to create goal";
    toast.add({
      severity: "error",
      summary: "Save failed",
      detail: createError.value,
      life: 3500,
    });
  } finally {
    createLoading.value = false;
  }
}

async function handleCompleteGoal(goalId: string) {
  try {
    await goalsStore.updateGoal(goalId, { status: "completed" });
    toast.add({
      severity: "success",
      summary: "Goal completed",
      detail: "Great work. Keep your momentum going.",
      life: 2500,
    });

    const newlyUnlocked = await achievementsStore.fetchAchievements({ detectNewUnlocks: true });
    showUnlockedAchievementToasts(newlyUnlocked);
  } catch {
    toast.add({
      severity: "error",
      summary: "Update failed",
      detail: "Could not mark goal as completed.",
      life: 3000,
    });
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <div class="mb-6 rounded-3xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur-sm sm:px-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
            <i class="pi pi-compass text-base" />
          </div>
          <div>
            <h1 class="text-2xl font-semibold leading-tight sm:text-3xl">Growth Tracker</h1>
            <p class="text-sm text-slate-500">Personal development</p>
          </div>
        </div>

        <div class="dashboard-nav-actions flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0">
          <Button
            label="Dashboard"
            icon="pi pi-th-large"
            :outlined="activeSection !== 'dashboard'"
            :severity="activeSection === 'dashboard' ? 'contrast' : 'secondary'"
            class="shrink-0"
            aria-label="Show dashboard"
            @click="activeSection = 'dashboard'"
          />
          <Button
            label="Achievements"
            icon="pi pi-trophy"
            :outlined="activeSection !== 'achievements'"
            :severity="activeSection === 'achievements' ? 'contrast' : 'secondary'"
            class="shrink-0"
            aria-label="Show achievements"
            @click="activeSection = 'achievements'"
          />
          <Button
            label="New Goal"
            icon="pi pi-plus"
            class="shrink-0"
            aria-label="Create new goal"
            @click="openCreateGoalDialog"
          />
          <Button
            icon="pi pi-sign-out"
            label="Sign out"
            severity="danger"
            outlined
            class="shrink-0"
            aria-label="Sign out"
            @click="handleSignOut"
          />
        </div>
      </div>
    </div>

    <section v-if="activeSection === 'dashboard'" class="space-y-6" aria-labelledby="dashboard-heading">
      <div>
        <h2 id="dashboard-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h2>
        <p class="mt-2 text-slate-500">
          {{ activeGoalsCount === 0 ? 'No active goals yet' : 'Keep building momentum on your active goals' }}
        </p>
      </div>

      <Message v-if="goalsStore.loading" severity="info" :closable="false">Loading goals...</Message>

      <Card v-else-if="goalsStore.goals.length === 0" class="py-10 sm:py-14">
        <template #content>
          <div class="mx-auto max-w-xl text-center">
            <h3 class="text-2xl font-medium sm:text-3xl">No goals yet</h3>
            <p class="mt-3 text-slate-500">Create your first goal to start tracking your progress</p>
            <Button
              class="mt-6"
              icon="pi pi-plus"
              label="Create Goal"
              aria-label="Create your first goal"
              @click="openCreateGoalDialog"
            />
          </div>
        </template>
      </Card>

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <Card
          v-for="goal in goalsStore.goals"
          :key="goal.id"
          class="h-full"
        >
          <template #title>
            <div class="flex items-center justify-between gap-3">
              <span class="text-lg leading-snug">{{ goal.title }}</span>
              <Tag :severity="statusSeverity(goal.status)" :value="goal.status" />
            </div>
          </template>
          <template #content>
            <p v-if="goal.description" class="text-sm text-slate-700">{{ goal.description }}</p>
            <p v-if="goal.action_plan" class="mt-2 text-sm text-slate-500">{{ goal.action_plan }}</p>
            <div class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
              {{ formatGoalDateRange(goal.start_date, goal.target_date) }}
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <Button
                size="small"
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                @click="openEditGoalDialog(goal)"
              />
              <Button
                v-if="goal.status !== 'completed'"
                size="small"
                label="Complete"
                icon="pi pi-check"
                @click="handleCompleteGoal(goal.id)"
              />
            </div>
          </template>
        </Card>
      </div>
    </section>

    <section v-else class="space-y-6" aria-labelledby="achievements-heading">
      <div>
        <h2 id="achievements-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">Achievements</h2>
        <p class="mt-2 text-slate-500">{{ achievementsStore.unlocked.length }} of {{ achievementsStore.items.length }} unlocked</p>
      </div>

      <Message v-if="achievementsStore.loading" severity="info" :closable="false">Loading achievements...</Message>
      <Message v-else-if="achievementsStore.error" severity="error" :closable="false">{{ achievementsStore.error }}</Message>

      <div class="rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-600 p-6 text-white shadow-lg shadow-teal-500/25 sm:p-7">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-4xl font-bold sm:text-5xl">{{ achievementsStore.percent }}%</p>
            <p class="mt-2 text-white/90">{{ achievementsStore.unlocked.length }} achievements unlocked</p>
          </div>
          <i class="pi pi-trophy text-3xl text-white/90 sm:text-4xl" />
        </div>
        <ProgressBar class="mt-5" :value="achievementsStore.percent" :showValue="false" />
      </div>

      <div v-if="achievementsStore.unlocked.length > 0" class="space-y-3">
        <h3 class="text-xl font-semibold sm:text-2xl">Unlocked</h3>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="achievement in achievementsStore.unlocked" :key="achievement.id" class="h-full">
            <template #content>
              <div class="space-y-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <i :class="achievement.icon || 'pi pi-check-circle'" />
                </div>
                <p class="text-lg font-semibold">{{ achievement.name }}</p>
                <p class="text-sm text-slate-500">{{ achievement.description }}</p>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xl font-semibold sm:text-2xl">Locked</h3>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="achievement in achievementsStore.locked" :key="achievement.id" class="h-full">
            <template #content>
              <div class="space-y-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <i class="pi pi-lock" />
                </div>
                <p class="text-lg font-semibold text-slate-700">{{ achievement.name }}</p>
                <p class="text-sm text-slate-500">{{ achievement.description }}</p>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </section>

    <Dialog
      v-model:visible="createGoalDialogVisible"
      modal
      :header="goalDialogHeader"
      class="goal-dialog w-[96vw] max-w-2xl"
      :draggable="false"
      :breakpoints="{ '960px': '90vw', '640px': '96vw' }"
      :dismissableMask="true"
      :blockScroll="true"
    >
      <div class="goal-form-shell space-y-4">
        <div class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-slate-700">
          <p class="font-semibold">Tips for setting goals:</p>
          <ul class="ml-4 mt-2 list-disc space-y-1 text-sm">
            <li>Be specific about what you want to achieve</li>
            <li>Make it measurable with clear milestones</li>
            <li>Set realistic timelines</li>
            <li>Think through potential obstacles</li>
          </ul>
        </div>

        <div class="space-y-1">
          <label for="goal-title" class="text-sm text-slate-700">Title</label>
          <InputText inputId="goal-title" v-model="title" placeholder="Learn Spanish" class="w-full" />
        </div>

        <div class="space-y-1">
          <label for="goal-description" class="text-sm text-slate-700">What do you want to achieve?</label>
          <Textarea inputId="goal-description" v-model="description" rows="2" placeholder="I want to be conversational in Spanish and be able to hold basic conversations with native speakers" class="w-full" autoResize />
        </div>

        <div class="space-y-1">
          <label for="goal-action-plan" class="text-sm text-slate-700">Action plan</label>
          <Textarea inputId="goal-action-plan" v-model="actionPlan" rows="3" placeholder="Practice 30 min/day with Duolingo, watch Spanish shows, find a language exchange partner" class="w-full" autoResize />
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="space-y-1">
            <label for="goal-metric-label" class="text-sm text-slate-700">Metric label</label>
            <InputText inputId="goal-metric-label" v-model="metricLabel" placeholder="pages" />
          </div>
          <div class="space-y-1">
            <label for="goal-metric-target" class="text-sm text-slate-700">Metric target</label>
            <InputNumber
              inputId="goal-metric-target"
              v-model="metricTarget"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              placeholder="20"
              class="w-full"
            />
          </div>
          <div class="space-y-1">
            <label for="goal-metric-unit" class="text-sm text-slate-700">Metric unit</label>
            <InputText inputId="goal-metric-unit" v-model="metricUnit" placeholder="pages/day" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="space-y-1">
            <label for="goal-start-date" class="text-sm text-slate-700">Start date</label>
            <DatePicker
              inputId="goal-start-date"
              v-model="startDate"
              dateFormat="yy-mm-dd"
              showIcon
              iconDisplay="input"
              class="w-full"
            />
          </div>
          <div class="space-y-1">
            <label for="goal-target-date" class="text-sm text-slate-700">Target date</label>
            <DatePicker
              inputId="goal-target-date"
              v-model="targetDate"
              dateFormat="yy-mm-dd"
              showIcon
              iconDisplay="input"
              class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
          <label for="goal-specific" class="flex items-center gap-2"><Checkbox inputId="goal-specific" v-model="isSpecific" binary /> Specific</label>
          <label for="goal-measurable" class="flex items-center gap-2"><Checkbox inputId="goal-measurable" v-model="isMeasurable" binary /> Measurable</label>
          <label for="goal-realistic" class="flex items-center gap-2"><Checkbox inputId="goal-realistic" v-model="isRealistic" binary /> Realistic</label>
          <label for="goal-positive" class="flex items-center gap-2"><Checkbox inputId="goal-positive" v-model="isPositive" binary /> Positive</label>
          <label for="goal-personal" class="flex items-center gap-2"><Checkbox inputId="goal-personal" v-model="isPersonal" binary /> Personal</label>
          <label for="goal-aligned" class="flex items-center gap-2"><Checkbox inputId="goal-aligned" v-model="isAligned" binary /> Aligned</label>
        </div>

        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
      </div>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <Button label="Cancel" severity="secondary" outlined @click="createGoalDialogVisible = false" />
          <Button
            @click="handleSaveGoal"
            :loading="createLoading"
            :label="goalDialogActionLabel"
            icon="pi pi-check"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>