import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

export const achievementsRouter = Router();

achievementsRouter.use(requireAuth);

achievementsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Missing authenticated user",
      });
    }

    const [{ data: achievements, error: achievementsError }, { data: unlockedRows, error: unlockedError }] =
      await Promise.all([
        supabaseAdmin
          .from("achievements")
          .select("id, name, description, icon, condition_key, points, created_at")
          .order("created_at", { ascending: true }),
        supabaseAdmin
          .from("user_achievements")
          .select("achievement_id, unlocked_at")
          .eq("user_id", userId),
      ]);

    if (achievementsError) {
      return res.status(500).json({
        code: "ACHIEVEMENTS_FETCH_FAILED",
        message: "Failed to fetch achievements",
        details: achievementsError.message,
      });
    }

    if (unlockedError) {
      return res.status(500).json({
        code: "UNLOCKED_FETCH_FAILED",
        message: "Failed to fetch unlocked achievements",
        details: unlockedError.message,
      });
    }

    const unlockedMap = new Map<string, string>();
    for (const row of unlockedRows ?? []) {
      unlockedMap.set(row.achievement_id, row.unlocked_at);
    }

    const data = (achievements ?? []).map((achievement) => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlocked_at: unlockedMap.get(achievement.id) ?? null,
    }));

    return res.json({ data });
  } catch (err) {
    return res.status(500).json({
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
