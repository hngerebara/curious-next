import type { EntryPreferences } from "./course-plan";

export type ExplanationLevel = EntryPreferences["explanationLevel"];
export type Draft = { prompt: string; checklist: string; explanation: string };
export type CriterionId = "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
export type Task = { version: string; objectiveId: "AI-2"; rubricVersion: "AI-2-v2"; policyVersion: "pilot-v1"; title: string; source: string; brief: string; criteria: { id: CriterionId; title: string; standard: string; remediation: string }[]; status: "preview" };
export type Variant = { id: string; version: string; explanationLevel: ExplanationLevel; content: string; hash: string; objectiveId: "AI-2"; rubricVersion: "AI-2-v2"; locale: "en" };
export type Practice = { id: string; key: string; revision: number; prompt: string; response: string | null; state: "pending" | "succeeded" | "failed"; code: string | null; configuration: string; calls: number; leaseUntil: string | null };
export type Help = { id: string; key: string; kind: "hint" | "worked_solution"; content: string; substantive: true; deliveredAt: string };
export type Frozen = { task: Task; draft: Draft; practice: Practice[]; response: string; help: Help[]; variant: Variant; mode: "practice" | "independent"; assisted: boolean };
export type EvidenceField = keyof Draft | "response";
export type CriterionResult = { id: CriterionId; result: "met" | "not_met" | "uncertain"; citations: { field: EvidenceField; quote: string; start: number; end: number }[]; feedback: string };
export type Decision = { rubricVersion: "AI-2-v2"; policyVersion: "pilot-v1"; status: "succeeded" | "uncertain" | "failed"; criteria: CriterionResult[]; code: string | null };
export type AssessmentRun = { id: string; decision: Decision; configuration: string; assessedAt: string };
export type Submission = { id: string; key: string; hash: string; frozen: Frozen; submittedAt: string; job: { state: "pending" | Decision["status"]; claims: number; leaseUntil: string | null }; assessments: AssessmentRun[]; reviewRequested: boolean };
export type Attempt = { id: string; enrollmentId: string; mode: "practice" | "independent"; task: Task; draft: Draft; revision: number; assisted: boolean; variant: Variant; practice: Practice[]; help: Help[]; submission: Submission | null; createdAt: string };
export type Capability = { state: "not_assessed" | "developing" | "demonstrated"; firstIndependentEvidenceId: string | null; latestEvidenceId: string | null; retention: "not_checked"; transfer: "not_checked"; policyVersion: "pilot-v1" };
export type Evidence = { id: string; objectiveId: "AI-2"; attemptId: string; submissionId: string; assessmentId: string; type: "practice_application" | "assisted_application" | "independent_application"; assisted: boolean; demonstrated: boolean; criteria: CriterionResult[]; rubricVersion: "AI-2-v2"; policyVersion: "pilot-v1"; assessedAt: string };
export type LearningRecommendation = { objectiveId: string; kind: "learn" | "practise"; title: string; reason: string; minutes: number; evidenceId: string | null; scope: "preview" };
export type Learning = { enrollmentId: string; attempts: { id: string; mode: Attempt["mode"]; submitted: boolean; assisted: boolean; createdAt: string }[]; capability: Capability; evidence: Evidence[]; recommendation: LearningRecommendation; recallDueAt: string | null; transferAvailable: boolean };
export interface PracticeModel { configuration: string; respond(task: Task, history: Practice[], prompt: string): Promise<string> }
export interface Assessor { configuration: string; assess(frozen: Frozen): Promise<unknown> }
export interface AttemptStore {
  create(owner: string, enrollmentId: string, mode: Attempt["mode"], key: string, level: ExplanationLevel): Promise<Attempt>;
  read(owner: string, id: string): Promise<Attempt>;
  learning(owner: string, enrollmentId: string, budget: number): Promise<Learning>;
  save(owner: string, id: string, revision: number, draft: Draft): Promise<Attempt>;
  variant(owner: string, id: string, level: ExplanationLevel): Promise<Attempt>;
  help(owner: string, id: string, key: string, kind: Help["kind"], content: string): Promise<Attempt>;
  reservePractice(owner: string, id: string, key: string, revision: number, configuration: string): Promise<{ attempt: Attempt; request: Practice; lease: string | null }>;
  finishPractice(owner: string, id: string, requestId: string, lease: string, response: string | null, code: string | null): Promise<Attempt>;
  submit(owner: string, id: string, revision: number, key: string): Promise<Attempt>;
  claim(owner: string, id: string, configuration: string): Promise<{ attempt: Attempt; lease: string | null }>;
  finish(owner: string, id: string, lease: string, decision: Decision, configuration: string): Promise<Attempt>;
  review(owner: string, id: string): Promise<Attempt>;
}
