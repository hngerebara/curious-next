export type TutorPreferences = { explanation: "simple" | "beginner" | "standard" | "technical"; visuals: "balanced" | "visual"; minutes: 10 | 20 | 40; language: "en" };
export type TutorGoal = { text: string; clarification: string; preferences: TutorPreferences };
export type TutorModule = { id: string; title: string; outcome: string; reason: string; prerequisites: string[] };
export type TutorQuestion = { id: string; moduleId: string; prompt: string; options: string[]; correct: number };
export type TutorProposal = { state: "ready" | "clarification" | "limited"; title: string; outcome: string; reason: string; question: string; modules: TutorModule[]; diagnostic: TutorQuestion[] };
export type TutorPlacement = { answers: number[]; suggested: string; selected: string; reason: string };
export type TutorPath = { preferences?:TutorPreferences; preferenceVersion?:number; id: string; version: 1; revision: number; requestKey: string; goal: TutorGoal; configuration: string; state: "generating" | "failed" | "proposed" | "accepted"; proposal: TutorProposal | null; acceptedAt: string | null; placement: TutorPlacement | null; generation: { count: number; lease: string | null; until: number; code: string | null }; createdAt: string };
export type TutorPublicPath = Omit<TutorPath, "proposal"> & { proposal: (Omit<TutorProposal, "diagnostic"> & { diagnostic: Omit<TutorQuestion, "correct">[] }) | null };
export interface TutorStore {
  list(owner: string): Promise<TutorPath[]>;
  read(owner: string, id: string): Promise<TutorPath | null>;
  create(owner: string, path: TutorPath): Promise<TutorPath>;
  change(owner: string, id: string, update: (path: TutorPath) => TutorPath): Promise<TutorPath>;
}
export interface TutorGenerator { configuration: string; path(goal: TutorGoal): Promise<unknown> }

export type TutorNextAction = {moduleId:string|null;sessionId:string|null;kind:string;reason:string;complete:boolean};
