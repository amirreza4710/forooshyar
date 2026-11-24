import { z } from "zod";
export { HYDRA_MAX_DEBATE_ROUNDS } from "./hydra-acp.contract";
import { HYDRA_MAX_DEBATE_ROUNDS } from "./hydra-acp.contract";

export const ModelFamilySchema = z.enum([
  "anthropic",
  "google",
  "openai",
  "deepseek",
  "local",
]);
export type ModelFamily = z.infer<typeof ModelFamilySchema>;

export const TaskDomainSchema = z.enum([
  "architecture",
  "backend",
  "frontend",
  "docs",
  "qa",
  "review",
]);
export type TaskDomain = z.infer<typeof TaskDomainSchema>;

export const TaskTierSchema = z.enum([
  "L1_ROUTINE",   // تسک‌های ساده و پرحجم (اولویت سرعت و هزینه)
  "L2_FEATURE",   // توسعه فیچر استاندارد (نیازمند ریویوی متقابل)
  "L2_HIGH_IMPACT", // تسک‌های پراهمیت (معادل L2_FEATURE با ریویوی متقابل)
  "L3_CRITICAL",  // معماری، اسکیما و تصمیمات حساس بیزینسی (اولویت کیفیت مطلق)
]);
export type TaskTier = z.infer<typeof TaskTierSchema>;

export const ModelCapabilitySchema = z.enum([
  "structured_output",
  "tool_calling",
  "long_context_200k",
  "vision",
  "mcp_drive",
]);
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

export const ScoreSchema = z.number().min(0).max(100);

/**
 * مشخصات هر مدل کشف‌شده در لحظه اجرا (Runtime Discovery Snapshot)
 */
export const DiscoveredModelSchema = z.object({
  id: z.string().min(1).optional(),
  modelId: z.string().min(1),
  family: ModelFamilySchema,
  harness: z
    .enum(["antigravity", "codex", "opencode", "claude-code", "api"])
    .optional()
    .default("api"),
  available: z.boolean(),
  contextWindow: z.number().int().positive(),
  capabilities: z.array(ModelCapabilitySchema).min(1),
  /** امتیاز پایه شایستگی در هر حوزه یا نمره اسکالر */
  priorScores: z.record(TaskDomainSchema, ScoreSchema).optional(),
  priorScore: ScoreSchema.optional(),
  /** امتیاز تجربی اختیاری از اجراهای قبلی */
  empiricalScores: z.record(TaskDomainSchema, ScoreSchema).optional(),
  empiricalScore: ScoreSchema.optional(),
  /** شاخص نسبی هزینه (۰ ارزان‌ترین، ۱۰۰ گران‌ترین) */
  costIndex: ScoreSchema,
});
export type DiscoveredModel = z.infer<typeof DiscoveredModelSchema>;

/**
 * ورودی موتور انتخاب مدل و اعطای وظیفه (Model Selector Input)
 */
export const HydraModelSelectionRequestSchema = z.object({
  taskId: z.string().min(1),
  domain: TaskDomainSchema,
  tier: TaskTierSchema,
  requiredCapabilities: z
    .array(ModelCapabilitySchema)
    .default(["structured_output", "tool_calling"]),
  inventory: z.array(DiscoveredModelSchema).min(1),
  lambda: z.number().min(0).max(1).optional(),
});
export type HydraModelSelectionRequest = z.infer<
  typeof HydraModelSelectionRequestSchema
>;

export const ModelAssignmentSchema = z.object({
  modelId: z.string().min(1),
  family: ModelFamilySchema,
  meritScore: ScoreSchema,
  reason: z.string().min(1),
});
export type ModelAssignment = z.infer<typeof ModelAssignmentSchema>;

/**
 * خروجی قطعی و معتبرسازی‌شده موتور انتخاب مدل برای Hydra ACP Dispatcher
 */
export const HydraModelDispatchPlanSchema = z
  .object({
    taskId: z.string().min(1),
    /** مغز متفکر منتخب پویا از بین مدل‌های آنلاین (Dynamic Orchestrator) */
    orchestrator: ModelAssignmentSchema,
    /** مجری اصلی تسک بر اساس بالاترین امتیاز شایستگی */
    executor: ModelAssignmentSchema,
    /** داور بازبینی متقابل (برای L1 اختیاری/null، برای L2/L3 الزامی) */
    reviewer: ModelAssignmentSchema.nullable(),
    /** نگاشت مستقیم به ۳ نقش سنای هیدرا در TASK-004 */
    senateRoles: z.object({
      strategist: z.string().min(1),
      architect: z.string().min(1),
      auditor: z.string().min(1),
    }),
    maxDebateRounds: z.literal(HYDRA_MAX_DEBATE_ROUNDS),
    crossFamilyVerified: z.boolean(),
    fallbackUsed: z.boolean(),
  })
  .superRefine((plan, ctx) => {
    // قفل گاردریل: اگر crossFamilyVerified تایید شده، خانواده مجری و داور نباید یکی باشد
    if (
      plan.crossFamilyVerified &&
      plan.reviewer &&
      plan.reviewer.family === plan.executor.family
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Cross-family review violation: executor and reviewer cannot share the same model family.",
        path: ["reviewer", "family"],
      });
    }
  });
export type HydraModelDispatchPlan = z.infer<typeof HydraModelDispatchPlanSchema>;

/**
 * رویداد سبک بازخورد شایستگی (متصل به HydraExecutionReceipt در پایان هر اجرا)
 */
export const MeritFeedbackEventSchema = z.object({
  receiptId: z.string().min(1),
  taskId: z.string().min(1),
  modelId: z.string().min(1),
  domain: TaskDomainSchema,
  passedFirstTry: z.boolean(),
  reviewRoundsUsed: z.number().int().min(0).max(HYDRA_MAX_DEBATE_ROUNDS),
  violatedPathOwnership: z.boolean().default(false),
  deltaScore: z.number().min(-25).max(15),
  recordedAt: z.string().datetime(),
});
export type MeritFeedbackEvent = z.infer<typeof MeritFeedbackEventSchema>;
