export type Subject = "practical-ai" | "cybersecurity";
export type Intent = "customer-emails" | "study-notes" | "ai-workflow" | "phishing" | "accounts" | "digital-safety";
export type GoalInput = { goalText: string; explanationLevel: "very-simple" | "beginner" | "standard" | "technical"; teachingLanguage: "en"; sessionMinutes: 10 | 20 | 40; clarification?: string };
export type Goal = { id: string; version: number; input: GoalInput };
export type Objective = { id: string; title: string; prerequisites: string[]; rubricVersion: string; references: string[] };
export type Catalogue = { version: string; status: "draft"; objectives: Objective[] };
export type Proposal = { subject: Subject; intent: Intent; title: string; outcome: string; reason: string; goalEvidence: string; context: string; modules: { objective: Objective; introduction: string }[] };
export type GenerationResult = { state: "ready-preview"; proposal: Proposal } | { state: "clarification"; question: string } | { state: "unsupported"; message: string } | { state: "failed"; code: string };
export type Plan = { id: string; requestKey: string; goal: Goal; state: "generating" | GenerationResult["state"]; result: GenerationResult | null; catalogueVersion: string; configuration: string; attempts: number; retryAfter: string | null };
export type Enrollment = { id: string; plan: Plan; placement: { mode: "skip" | "diagnostic"; objectiveId: string; reason: string; answers?: string[] } | null; startObjectiveId: string | null };
export interface CourseGenerator { configuration: string; generate(input: GoalInput, catalogue: Catalogue): Promise<unknown> }
export interface CourseStore {
  goal(owner: string): Promise<Goal | null>;
  saveGoal(owner: string, input: GoalInput, expectedVersion: number): Promise<Goal>;
  ownedGoal(owner: string, id: string): Promise<Goal | null>;
  latestPlan(owner: string, goalId: string): Promise<Plan | null>;
  readPlan(owner: string, id: string): Promise<Plan | null>;
  reserve(owner: string, goal: Goal, key: string, configuration: string, catalogueVersion: string): Promise<{ plan: Plan; lease: string | null }>;
  finish(owner: string, id: string, lease: string, result: GenerationResult): Promise<Plan>;
  accept(owner: string, plan: Plan, key: string): Promise<Enrollment>;
  enrollment(owner: string, id: string): Promise<Enrollment | null>;
  start(owner: string, id: string, objectiveId: string): Promise<Enrollment>;
  place(owner: string, id: string, placement: NonNullable<Enrollment["placement"]>): Promise<Enrollment>;
}
