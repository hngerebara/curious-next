export type LearningScene = {
  version: 1;
  kind: "quantity" | "connections" | "sequence" | "scenario" | "comparison";
  prompt: string;
  connections: { from: number; to: number; label: string }[];
};
export type SceneState = { selected: number; explored: number[]; value: number };
