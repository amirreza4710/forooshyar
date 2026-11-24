import { describe, expect, it } from "vitest";
import {
  HYDRA_MAX_DEBATE_ROUNDS,
  type DiscoveredModel,
  type HydraModelSelectionRequest,
  HydraModelDispatchPlanSchema,
} from "./model-routing.schema";
import { computeMeritScore, selectHydraModels } from "./model-selector";

function createMockModel(overrides: Partial<DiscoveredModel> = {}): DiscoveredModel {
  return {
    modelId: "test-model-01",
    family: "openai",
    harness: "api",
    available: true,
    contextWindow: 128000,
    capabilities: ["structured_output", "tool_calling"],
    priorScores: {
      architecture: 80,
      backend: 80,
      frontend: 80,
      docs: 80,
      qa: 80,
      review: 80,
    },
    costIndex: 30,
    ...overrides,
  };
}

describe("Hydra ACP Merit-Based Model Selector", () => {
  describe("computeMeritScore formula", () => {
    it("calculates (0.6 * prior + 0.4 * empirical) - lambda * costIndex correctly", () => {
      const model = createMockModel({
        priorScores: { backend: 90, architecture: 50, frontend: 50, docs: 50, qa: 50, review: 50 },
        empiricalScores: { backend: 80, architecture: 50, frontend: 50, docs: 50, qa: 50, review: 50 },
        costIndex: 20,
      });

      // Raw: 0.6 * 90 + 0.4 * 80 = 54 + 32 = 86
      // Penalty: 0.2 * 20 = 4
      // Final: 86 - 4 = 82
      const score = computeMeritScore(model, "backend", 0.2);
      expect(score).toBe(82);
    });

    it("falls back to prior score when empirical score is omitted", () => {
      const model = createMockModel({
        priorScores: { backend: 90, architecture: 50, frontend: 50, docs: 50, qa: 50, review: 50 },
        costIndex: 10,
      });

      // Raw: 0.6 * 90 + 0.4 * 90 = 90
      // Penalty: 0.1 * 10 = 1
      // Final: 89
      const score = computeMeritScore(model, "backend", 0.1);
      expect(score).toBe(89);
    });
  });

  describe("selectHydraModels Contract Requirements", () => {
    // (الف) انتخاب مدل ارزان برای L1_ROUTINE بدون ریویو
    it("(a) selects low-cost model for L1_ROUTINE with null reviewer and no cross-family review", () => {
      const expensiveModel = createMockModel({
        modelId: "expensive-flagship",
        family: "openai",
        priorScores: { backend: 92, architecture: 90, frontend: 80, docs: 80, qa: 80, review: 80 },
        costIndex: 90,
      });
      const cheapModel = createMockModel({
        modelId: "cheap-efficient",
        family: "google",
        priorScores: { backend: 86, architecture: 80, frontend: 80, docs: 80, qa: 80, review: 80 },
        costIndex: 10,
      });

      const request: HydraModelSelectionRequest = {
        taskId: "TASK-L1-ROUTINE-01",
        domain: "backend",
        tier: "L1_ROUTINE",
        requiredCapabilities: ["structured_output", "tool_calling"],
        inventory: [expensiveModel, cheapModel],
      };

      const plan = selectHydraModels(request);

      expect(plan.taskId).toBe("TASK-L1-ROUTINE-01");
      // cheapModel wins because cost penalty in L1 heavily favors low costIndex
      expect(plan.executor.modelId).toBe("cheap-efficient");
      expect(plan.reviewer).toBeNull();
      expect(plan.crossFamilyVerified).toBe(false);
      expect(plan.fallbackUsed).toBe(false);
      expect(plan.maxDebateRounds).toBe(HYDRA_MAX_DEBATE_ROUNDS);
      expect(plan.senateRoles.strategist).toBeDefined();
    });

    // (ب) انتخاب میان‌خانواده‌ای برای L2/L3
    it("(b) enforces cross-family reviewer selection for L2 and L3 tasks", () => {
      const anthropicModel = createMockModel({
        modelId: "claude-3-5-sonnet",
        family: "anthropic",
        priorScores: { backend: 96, architecture: 90, frontend: 85, docs: 85, qa: 85, review: 90 },
        costIndex: 30,
      });
      const openaiModel = createMockModel({
        modelId: "gpt-4o",
        family: "openai",
        priorScores: { backend: 90, architecture: 92, frontend: 85, docs: 85, qa: 85, review: 95 },
        costIndex: 30,
      });
      const googleModel = createMockModel({
        modelId: "gemini-1-5-pro",
        family: "google",
        contextWindow: 1000000,
        priorScores: { backend: 88, architecture: 98, frontend: 85, docs: 85, qa: 85, review: 88 },
        costIndex: 25,
      });

      const request: HydraModelSelectionRequest = {
        taskId: "TASK-L2-FEATURE-01",
        domain: "backend",
        tier: "L2_FEATURE",
        requiredCapabilities: ["structured_output", "tool_calling"],
        inventory: [anthropicModel, openaiModel, googleModel],
      };

      const plan = selectHydraModels(request);

      expect(plan.executor.modelId).toBe("claude-3-5-sonnet");
      expect(plan.reviewer).not.toBeNull();
      // Reviewer must NOT be anthropic
      expect(plan.reviewer?.family).not.toBe("anthropic");
      expect(plan.reviewer?.family).toBe("openai"); // highest review score among non-anthropic
      expect(plan.crossFamilyVerified).toBe(true);
      expect(plan.fallbackUsed).toBe(false);
      expect(plan.orchestrator.modelId).toBe("gemini-1-5-pro"); // highest combined arch + contextWindow
      expect(plan.senateRoles.strategist).toBe("gemini-1-5-pro");
      expect(plan.senateRoles.auditor).toBe(plan.reviewer?.modelId);
    });

    // (ج) رفتار fallbackUsed هنگام آنلاین بودن فقط یک خانواده
    it("(c) activates fallbackUsed: true when only a single model family is available online", () => {
      const primaryOpenAI = createMockModel({
        modelId: "gpt-4o",
        family: "openai",
        available: true,
        priorScores: { backend: 95, architecture: 90, frontend: 80, docs: 80, qa: 80, review: 85 },
        costIndex: 35,
      });
      const secondaryOpenAI = createMockModel({
        modelId: "gpt-4o-mini",
        family: "openai",
        available: true,
        priorScores: { backend: 80, architecture: 75, frontend: 75, docs: 75, qa: 75, review: 90 },
        costIndex: 10,
      });
      const offlineAnthropic = createMockModel({
        modelId: "claude-sonnet-offline",
        family: "anthropic",
        available: false, // offline
        priorScores: { backend: 98, architecture: 95, frontend: 90, docs: 90, qa: 90, review: 95 },
      });

      const request: HydraModelSelectionRequest = {
        taskId: "TASK-L3-CRITICAL-FALLBACK",
        domain: "backend",
        tier: "L3_CRITICAL",
        requiredCapabilities: ["structured_output", "tool_calling"],
        inventory: [primaryOpenAI, secondaryOpenAI, offlineAnthropic],
      };

      const plan = selectHydraModels(request);

      expect(plan.executor.family).toBe("openai");
      expect(plan.reviewer).not.toBeNull();
      expect(plan.reviewer?.family).toBe("openai");
      expect(plan.fallbackUsed).toBe(true);
      expect(plan.crossFamilyVerified).toBe(false);
      expect(plan.maxDebateRounds).toBe(2);

      // SuperRefine must pass cleanly when fallbackUsed is true and crossFamilyVerified is false
      expect(HydraModelDispatchPlanSchema.safeParse(plan).success).toBe(true);
    });

    // (د) تاثیر empiricalScores در تغییر برنده
    it("(d) allows empiricalScores to override priorScores when determining the winning model", () => {
      const priorHero = createMockModel({
        modelId: "model-prior-hero",
        family: "openai",
        priorScores: { frontend: 96, architecture: 80, backend: 80, docs: 80, qa: 80, review: 80 },
        empiricalScores: { frontend: 65, architecture: 80, backend: 80, docs: 80, qa: 80, review: 80 },
        costIndex: 20,
      });
      const empiricalHero = createMockModel({
        modelId: "model-empirical-hero",
        family: "google",
        priorScores: { frontend: 82, architecture: 80, backend: 80, docs: 80, qa: 80, review: 80 },
        empiricalScores: { frontend: 96, architecture: 80, backend: 80, docs: 80, qa: 80, review: 80 },
        costIndex: 20,
      });

      // priorHero: 0.6 * 96 + 0.4 * 65 = 57.6 + 26 = 83.6
      // empiricalHero: 0.6 * 82 + 0.4 * 96 = 49.2 + 38.4 = 87.6 (Wins!)
      const request: HydraModelSelectionRequest = {
        taskId: "TASK-EMPIRICAL-SHIFT",
        domain: "frontend",
        tier: "L2_FEATURE",
        requiredCapabilities: ["structured_output", "tool_calling"],
        inventory: [priorHero, empiricalHero],
      };

      const plan = selectHydraModels(request);

      expect(plan.executor.modelId).toBe("model-empirical-hero");
    });

    // (هـ) خطا دادن هنگام خالی بودن مدل‌های آنلاین واجد شرایط
    it("(e) throws an error when no online models match the required capabilities", () => {
      const offlineModel = createMockModel({
        available: false,
        capabilities: ["structured_output", "tool_calling"],
      });
      const incapableModel = createMockModel({
        available: true,
        capabilities: ["vision"], // Missing tool_calling & structured_output
      });

      const request: HydraModelSelectionRequest = {
        taskId: "TASK-EMPTY-ELIGIBLE",
        domain: "backend",
        tier: "L2_FEATURE",
        requiredCapabilities: ["structured_output", "tool_calling"],
        inventory: [offlineModel, incapableModel],
      };

      expect(() => selectHydraModels(request)).toThrow(
        /No eligible online models found matching required capabilities/
      );
    });

    // (و) رد شدن نقض crossFamilyVerified در Zod
    it("(f) rejects crossFamilyVerified: true in Zod superRefine when executor and reviewer share the same family", () => {
      const invalidPlan = {
        taskId: "TASK-VIOLATION-01",
        orchestrator: {
          modelId: "gpt-4o",
          family: "openai" as const,
          meritScore: 88,
          reason: "Orchestrator",
        },
        executor: {
          modelId: "gpt-4o",
          family: "openai" as const,
          meritScore: 92,
          reason: "Executor",
        },
        reviewer: {
          modelId: "gpt-4o-mini",
          family: "openai" as const, // VIOLATION: same family when crossFamilyVerified is true!
          meritScore: 85,
          reason: "Reviewer",
        },
        senateRoles: {
          strategist: "gpt-4o",
          architect: "gpt-4o",
          auditor: "gpt-4o-mini",
        },
        maxDebateRounds: 2 as const,
        crossFamilyVerified: true, // INVALID
        fallbackUsed: false,
      };

      const parseResult = HydraModelDispatchPlanSchema.safeParse(invalidPlan);

      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const violationIssue = parseResult.error.issues.find(
          (issue) => issue.path.join(".") === "reviewer.family"
        );
        expect(violationIssue).toBeDefined();
        expect(violationIssue?.message).toContain(
          "Cross-family review violation: executor and reviewer cannot share the same model family."
        );
      }
    });
  });
});
