import { Router } from "express";
import { supabaseAdmin} from "../config/supabase";
import { AuthRequest, requireAuth } from "../middleware/auth";

type GoalStatus = "active" | "paused" | "completed" | "cancelled"

interface CreateGoalBody {
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

function isDateOnly(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateCreateGoal(body: CreateGoalBody): string[] {
    const errors: string[] = [];

    if(!body.title || body.title.trim().length < 3 || body.title.trim().length > 200) {
        errors.push("Title is required and must be between 3 and 200 characters.");
    }

    if (!body.target_date || !isDateOnly(body.target_date)) {
    errors.push("target_date is required in YYYY-MM-DD format");
  }

  if (body.start_date && !isDateOnly(body.start_date)) {
    errors.push("start_date must be YYYY-MM-DD format");
  }

  if (body.start_date && body.target_date && body.start_date > body.target_date) {
    errors.push("start_date must be before or equal to target_date");
  }

  if (body.metric_target != null && Number(body.metric_target) <= 0) {
    errors.push("metric_target must be greater than 0");
  }

  return errors;
}

export const goalsRouter = Router();

goalsRouter.use(requireAuth);

goalsRouter.get("/", async (req: AuthRequest, res) => {
    const { data, error } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false});

    if (error) {
        return res.status(500).json({
            code: "GOALS_FETCH_FAILED",
            message: "Failed to fetch goals",
            details: error.message,
        });
    }

    return res.json({ data });
});

goalsRouter.post("/", async (req: AuthRequest, res) => {
    const body = req.body as CreateGoalBody;
    const validationErrors = validateCreateGoal(body);

    if (validationErrors.length > 0) {
        return res.status(400).json({
            code: "VALIDATION_ERROR",
            message: "Invalid goal payload",
            details: validationErrors,
        });
    }   

    const payload = {
        user_id: req.user!.id,
        title: body.title!.trim(),
        description: body.description ?? null,
        action_plan: body.action_plan ?? null,
        is_specific: body.is_specific ?? false,
        is_measurable: body.is_measurable ?? false,
        is_realistic: body.is_realistic ?? false,
        is_positive: body.is_positive ?? false,
        is_personal: body.is_personal ?? false,
        is_aligned: body.is_aligned ?? false,
        metric_label: body.metric_label ?? null,
        metric_target: body.metric_target ?? null,
        metric_unit: body.metric_unit ?? null,
        start_date: body.start_date ?? new Date().toISOString().slice(0, 10),
        target_date: body.target_date!,
        status: body.status ?? "active",
    };

    const { data, error } = await supabaseAdmin
    .from("goals")
    .insert(payload)
    .select("*")
    .single();

    if (error) {
        return res.status(500).json({
            code: "GOAL_CREATE_FAILED",
            message: "Failed to create goal",
            details: error.message,
        });
    }

    return res.status(201).json({ data });
})