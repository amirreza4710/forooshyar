import {
  HYDRA_MAX_DEBATE_ROUNDS,
  type DiscoveredModel,
  type HydraModelDispatchPlan,
  type HydraModelSelectionRequest,
  type ModelAssignment,
  type TaskDomain,
  HydraModelDispatchPlanSchema,
  HydraModelSelectionRequestSchema,
} from "./model-routing.schema";

/**
 * دریافت نمره پایه اولویت (Prior Score) برای یک مدل در حوزه مشخص
 */
function getPriorScore(model: DiscoveredModel, domain: TaskDomain): number {
  if (model.priorScores && model.priorScores[domain] !== undefined) {
    return model.priorScores[domain]!;
  }
  if (model.priorScore !== undefined) {
    return model.priorScore;
  }
  return 50;
}

/**
 * دریافت نمره تجربی (Empirical Score)؛ در صورت عدم وجود، مساوی نمره پایه محاسبه می‌شود
 */
function getEmpiricalScore(
  model: DiscoveredModel,
  domain: TaskDomain,
  fallbackPrior: number
): number {
  if (model.empiricalScores && model.empiricalScores[domain] !== undefined) {
    return model.empiricalScores[domain]!;
  }
  if (model.empiricalScore !== undefined) {
    return model.empiricalScore;
  }
  return fallbackPrior;
}

/**
 * محاسبه فرمول شایستگی با کسر جریمه هزینه:
 * meritScore = (0.6 * prior + 0.4 * empirical) - lambda * costIndex
 */
export function computeMeritScore(
  model: DiscoveredModel,
  domain: TaskDomain,
  lambda: number
): number {
  const prior = getPriorScore(model, domain);
  const empirical = getEmpiricalScore(model, domain, prior);
  const rawScore = 0.6 * prior + 0.4 * empirical;
  const penalized = rawScore - lambda * model.costIndex;
  return Math.max(0, Math.min(100, Math.round(penalized * 100) / 100));
}

/**
 * تابع خالص انتخاب هوشمند مدل‌های سنا و اجرای هیدرا (Hydra ACP Model Selector)
 * بدون هرگونه ساید‌افکت یا وابستگی خارجی (Pure Function)
 */
export function selectHydraModels(
  request: HydraModelSelectionRequest
): HydraModelDispatchPlan {
  const validatedReq = HydraModelSelectionRequestSchema.parse(request);

  // ۱. فیلتر مدل‌های آنلاین و در دسترس
  const availableModels = validatedReq.inventory.filter((m) => m.available);

  // ۲. فیلتر مدل‌های دارای تمام قابلیت‌های الزامی
  const eligibleModels = availableModels.filter((m) =>
    validatedReq.requiredCapabilities.every((cap) =>
      m.capabilities.includes(cap)
    )
  );

  if (eligibleModels.length === 0) {
    throw new Error(
      "No eligible online models found matching required capabilities."
    );
  }

  // ضریب جریمه هزینه (Lambda)
  const effectiveLambda =
    validatedReq.lambda !== undefined
      ? validatedReq.lambda
      : validatedReq.tier === "L1_ROUTINE"
      ? 0.35
      : validatedReq.tier === "L3_CRITICAL"
      ? 0.05
      : 0.2;

  // ۳. انتخاب پویا برای Orchestrator (بالاترین میانگین وزنی معماری و کانتکست بالا)
  const scoredOrchestrators = eligibleModels.map((m) => {
    const archScore = computeMeritScore(m, "architecture", 0.05);
    const contextScore = Math.min(
      100,
      Math.round((m.contextWindow / 200_000) * 100)
    );
    const combined = 0.7 * archScore + 0.3 * contextScore;
    return {
      model: m,
      combinedScore: Math.round(combined * 100) / 100,
      archScore,
    };
  });
  scoredOrchestrators.sort((a, b) => b.combinedScore - a.combinedScore);
  const bestOrchestrator = scoredOrchestrators[0];

  const orchestrator: ModelAssignment = {
    modelId: bestOrchestrator.model.modelId,
    family: bestOrchestrator.model.family,
    meritScore: bestOrchestrator.combinedScore,
    reason: `Orchestrator selected (ArchScore: ${bestOrchestrator.archScore}, ContextWindow: ${bestOrchestrator.model.contextWindow})`,
  };

  // ۴. انتخاب مجری اصلی (Executor) بر اساس بالاترین امتیاز شایستگی در حوزه تسک
  const scoredExecutors = eligibleModels.map((m) => ({
    model: m,
    score: computeMeritScore(m, validatedReq.domain, effectiveLambda),
  }));
  scoredExecutors.sort((a, b) => b.score - a.score);
  const bestExecutor = scoredExecutors[0];

  const executor: ModelAssignment = {
    modelId: bestExecutor.model.modelId,
    family: bestExecutor.model.family,
    meritScore: bestExecutor.score,
    reason: `Executor selected for domain ${validatedReq.domain} (MeritScore: ${bestExecutor.score}, CostIndex: ${bestExecutor.model.costIndex})`,
  };

  // ۵. تعیین داور بازبینی متقابل (Reviewer)
  let reviewer: ModelAssignment | null = null;
  let crossFamilyVerified = false;
  let fallbackUsed = false;

  if (validatedReq.tier === "L1_ROUTINE") {
    // تسک‌های L1 روتین نیازی به ریویوی متقابل ندارند (MVP-Only & Cost Optimization)
    reviewer = null;
    crossFamilyVerified = false;
    fallbackUsed = false;
  } else {
    // برای L2 و L3، ریویوی متقابل الزامی است
    const crossFamilyModels = eligibleModels.filter(
      (m) => m.family !== bestExecutor.model.family
    );

    if (crossFamilyModels.length > 0) {
      const scoredReviewers = crossFamilyModels.map((m) => ({
        model: m,
        score: computeMeritScore(m, "review", effectiveLambda),
      }));
      scoredReviewers.sort((a, b) => b.score - a.score);
      const bestReviewer = scoredReviewers[0];

      reviewer = {
        modelId: bestReviewer.model.modelId,
        family: bestReviewer.model.family,
        meritScore: bestReviewer.score,
        reason: `Cross-family reviewer selected (${bestReviewer.model.family} vs ${bestExecutor.model.family})`,
      };
      crossFamilyVerified = true;
      fallbackUsed = false;
    } else {
      // فقط یک خانواده آنلاین است؛ استفاده از fallback مجاز است
      const sameFamilyCandidates = eligibleModels.filter(
        (m) => m.modelId !== bestExecutor.model.modelId
      );
      const fallbackModel =
        sameFamilyCandidates.length > 0
          ? sameFamilyCandidates[0]
          : bestExecutor.model;
      const fallbackScore = computeMeritScore(
        fallbackModel,
        "review",
        effectiveLambda
      );

      reviewer = {
        modelId: fallbackModel.modelId,
        family: fallbackModel.family,
        meritScore: fallbackScore,
        reason: `Fallback single-family review (${fallbackModel.family})`,
      };
      crossFamilyVerified = false;
      fallbackUsed = true;
    }
  }

  // ۶. نگاشت مستقیم به ۳ نقش سنای هیدرا
  const senateRoles = {
    strategist: orchestrator.modelId,
    architect:
      validatedReq.domain === "architecture"
        ? executor.modelId
        : orchestrator.modelId,
    auditor: reviewer ? reviewer.modelId : orchestrator.modelId,
  };

  const dispatchPlan: HydraModelDispatchPlan = {
    taskId: validatedReq.taskId,
    orchestrator,
    executor,
    reviewer,
    senateRoles,
    maxDebateRounds: HYDRA_MAX_DEBATE_ROUNDS,
    crossFamilyVerified,
    fallbackUsed,
  };

  // اعتبارسنجی نهایی با Zod و گاردریل superRefine
  return HydraModelDispatchPlanSchema.parse(dispatchPlan);
}
