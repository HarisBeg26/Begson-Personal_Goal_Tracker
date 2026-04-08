import { supabaseAdmin } from "../config/supabase.js";

type AchievementRow = {
  id: string;
  condition_key: string;
  name: string;
  description: string;
};

type GoalStats = {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  hasMetricTargetAtLeast50: boolean;
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseGoalTargetFromText(text: string, actionWord: "create" | "complete"): number | null {
  const regex = new RegExp(`${actionWord}[^0-9]{0,12}(\\d+)\\s*goals?`, "i");
  const match = text.match(regex);
  return match ? Number(match[1]) : null;
}

function shouldUnlock(achievement: AchievementRow, stats: GoalStats): boolean {
  const key = normalize(achievement.condition_key);
  const name = normalize(achievement.name);
  const description = normalize(achievement.description);
  const allText = `${key} ${name} ${description}`;

  const createTarget = parseGoalTargetFromText(allText, "create");
  if (createTarget !== null) return stats.totalGoals >= createTarget;

  const completeTarget = parseGoalTargetFromText(allText, "complete");
  if (completeTarget !== null) return stats.completedGoals >= completeTarget;

  if ((allText.includes("first") && allText.includes("goal") && allText.includes("create")) || key === "first_step") {
    return stats.totalGoals >= 1;
  }

  if (allText.includes("finisher") || key.includes("complete_first_goal")) {
    return stats.completedGoals >= 1;
  }

  if (allText.includes("goal_setter")) return stats.totalGoals >= 5;
  if (allText.includes("ambitious")) return stats.totalGoals >= 10;
  if (allText.includes("dedicated")) return stats.completedGoals >= 5;

  if (allText.includes("consistent") && allText.includes("active")) {
    return stats.activeGoals >= 3;
  }

  if (allText.includes("halfway")) {
    return stats.hasMetricTargetAtLeast50;
  }

  if (allText.includes("perfect_week")) {
    return stats.completedGoals >= 2;
  }

  return false;
}

export async function evaluateAndUnlockAchievements(userId: string): Promise<void> {
  const [achievementsResult, unlockedResult, goalsResult] = await Promise.all([
    supabaseAdmin.from("achievements").select("id, condition_key, name, description"),
    supabaseAdmin.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabaseAdmin.from("goals").select("status, metric_target").eq("user_id", userId),
  ]);

  if (achievementsResult.error) {
    throw new Error(`Failed to fetch achievements: ${achievementsResult.error.message}`);
  }

  if (unlockedResult.error) {
    throw new Error(`Failed to fetch user achievements: ${unlockedResult.error.message}`);
  }

  if (goalsResult.error) {
    throw new Error(`Failed to fetch goals for achievement evaluation: ${goalsResult.error.message}`);
  }

  const achievements = (achievementsResult.data ?? []) as AchievementRow[];
  const unlockedIds = new Set((unlockedResult.data ?? []).map((row) => row.achievement_id));
  const goals = goalsResult.data ?? [];

  const stats: GoalStats = {
    totalGoals: goals.length,
    completedGoals: goals.filter((goal) => goal.status === "completed").length,
    activeGoals: goals.filter((goal) => goal.status === "active").length,
    hasMetricTargetAtLeast50: goals.some((goal) => Number(goal.metric_target ?? 0) >= 50),
  };

  const toInsert = achievements
    .filter((achievement) => !unlockedIds.has(achievement.id))
    .filter((achievement) => shouldUnlock(achievement, stats))
    .map((achievement) => ({ user_id: userId, achievement_id: achievement.id }));

  if (toInsert.length === 0) return;

  const { error: insertError } = await supabaseAdmin.from("user_achievements").insert(toInsert);

  if (insertError) {
    throw new Error(`Failed to unlock achievements: ${insertError.message}`);
  }
}
