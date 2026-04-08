import { defineStore } from "pinia";
import { ref } from "vue";
import { apiFetch } from "../lib/api";

export type GoalStatus = "active" | "paused" | "completed" | "cancelled";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  action_plan: string | null;
  is_specific: boolean;
  is_measurable: boolean;
  is_realistic: boolean;
  is_positive: boolean;
  is_personal: boolean;
  is_aligned: boolean;
  metric_label: string | null;
  metric_target: number | null;
  metric_unit: string | null;
  start_date: string;
  target_date: string;
  completed_at: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

interface CreateGoalInput {
  title: string;
  description?: string | null;
  action_plan?: string | null;
  is_specific?: boolean;
  is_measurable?: boolean;
  is_realistic?: boolean;
  is_positive?: boolean;
  is_personal?: boolean;
  is_aligned?: boolean;
  metric_label?: string | null;
  metric_target?: number | null;
  metric_unit?: string | null;
  start_date?: string | null;
  target_date: string;
  status?: GoalStatus;
}

interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  action_plan?: string | null;
  is_specific?: boolean;
  is_measurable?: boolean;
  is_realistic?: boolean;
  is_positive?: boolean;
  is_personal?: boolean;
  is_aligned?: boolean;
  metric_label?: string | null;
  metric_target?: number | null;
  metric_unit?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  status?: GoalStatus;
}

interface GoalsResponse {
  data: Goal[];
}

interface GoalResponse {
  data: Goal;
}

export const useGoalsStore = defineStore("goals", () => {
  const goals = ref<Goal[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchGoals() {
    loading.value = true;
    error.value = null;

    try {
      const res = await apiFetch<GoalsResponse>("/api/goals");
      goals.value = res.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load goals";
    } finally {
      loading.value = false;
    }
  }

  async function createGoal(input: CreateGoalInput) {
    error.value = null;

    try {
      const res = await apiFetch<GoalResponse>("/api/goals", {
        method: "POST",
        body: JSON.stringify(input),
      });
      goals.value.unshift(res.data);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create goal";
      throw err;
    }
  }

  async function updateGoal(goalId: string, input: UpdateGoalInput) {
    error.value = null;

    try {
      const res = await apiFetch<GoalResponse>(`/api/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      const index = goals.value.findIndex((goal) => goal.id === goalId);
      if (index !== -1) {
        goals.value[index] = res.data;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to update goal";
      throw err;
    }
  }

  return { goals, loading, error, fetchGoals, createGoal, updateGoal };
});