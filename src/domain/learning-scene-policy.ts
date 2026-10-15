import type { LessonBlock, TutorSession } from "../contracts/tutor-lesson";
import type { LearningScene } from "../contracts/learning-scene";
import { tutorKeys, tutorRecord, tutorText } from "./tutor-policy";

export function learningScene(value: unknown, block: LessonBlock): LearningScene {
  const fail = () => { throw Error("MODEL_INVALID"); };
  if (!tutorRecord(value) || !tutorKeys(value, ["version", "kind", "prompt", "connections"]) || value.version !== 1 || !["quantity", "connections", "sequence", "scenario", "comparison"].includes(String(value.kind)) || !tutorText(value.prompt, 8, 400) || !Array.isArray(value.connections) || value.connections.length > 12 || block.nodes.length < 2) return fail();
  if (value.kind === "quantity") {
    if (block.nodes.some(n => n.total < 1) || value.connections.length) return fail();
  } else {
    if (block.nodes.some(node => node.parts !== 0 || node.total !== 0)) return fail();
    const visited = new Set([0]), pairs = new Set<string>();
    for (const edge of value.connections) {
      if (!tutorRecord(edge) || !tutorKeys(edge, ["source", "target", "label"]) || !Number.isInteger(edge.source) || !Number.isInteger(edge.target) || Number(edge.source) < 0 || Number(edge.target) < 0 || Number(edge.source) >= block.nodes.length || Number(edge.target) >= block.nodes.length || edge.source === edge.target || !tutorText(edge.label, 1, 160)) return fail();
      const pair = `${edge.source}:${edge.target}`; if (pairs.has(pair)) return fail(); pairs.add(pair);
    }
    for (let i = 0; i < block.nodes.length; i++) for (const edge of value.connections) { if (visited.has(edge.source) || visited.has(edge.target)) { visited.add(edge.source); visited.add(edge.target); } }
    if (visited.size !== block.nodes.length) return fail();
    if (value.kind === "sequence" && (value.connections.length !== block.nodes.length - 1 || value.connections.some((edge, i) => edge.source !== i || edge.target !== i + 1))) return fail();
  }
  return value as LearningScene;
}

export function visualSceneRequired(blocks: LessonBlock[]) {
  if (blocks.filter(block => block.scene).length < 2) throw Error("MODEL_VISUAL_REQUIRED");
}

export function sceneDraft(value: unknown, session: TutorSession) {
  const fail = () => { throw Error("INVALID_DRAFT"); };
  if (!tutorRecord(value) || Object.keys(value).length > 88) return fail();
  for (const [key, state] of Object.entries(value)) {
    const match = key.match(/^([a-zA-Z0-9_-]{1,80})-(\d{1,2})$/);
    const blocks = match?.[1] === "original" ? session.lesson?.blocks : session.help.find(h => h.key === match?.[1] && h.state === "ready")?.blocks;
    const block = match && blocks?.[Number(match[2])];
    if (!block || !block.scene || !tutorRecord(state) || !tutorKeys(state, ["selected", "explored", "value"]) || !Number.isInteger(state.selected) || Number(state.selected) < 0 || Number(state.selected) >= block.nodes.length || !Number.isInteger(state.value) || Number(state.value) < 0 || Number(state.value) > (block.scene.kind === "quantity" ? block.nodes[Number(state.selected)].total : 0) || !Array.isArray(state.explored) || state.explored.length > block.nodes.length || new Set(state.explored).size !== state.explored.length || state.explored.some(i => !Number.isInteger(i) || i < 0 || i >= block.nodes.length)) return fail();
  }
}
