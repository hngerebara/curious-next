import { useId } from "react";
import type { LessonBlock } from "../contracts/tutor-lesson";
import type { LearningScene, SceneState } from "../contracts/learning-scene";
import { TutorSceneArt } from "./tutor-scene-art";
import "./tutor-world.css";

export function initialSceneState(block: LessonBlock): SceneState { return { selected: 0, explored: [], value: block.nodes[0]?.parts ?? 0 }; }
export function TutorScene({ block, scene, state, change, disabled = false }: { block: LessonBlock; scene: LearningScene; state: SceneState; change: (state: SceneState) => void; disabled?: boolean }) {
  const id = useId(), node = block.nodes[state.selected];
  if (!node) return null;
  function select(index: number) { change({ selected: index, explored: Array.from(new Set([...state.explored, index])), value: block.nodes[index].parts }); }
  return <figure className="learning-scene">
    <p className="scene-invitation">{scene.prompt}</p>
    <TutorSceneArt block={block} scene={scene} state={state} select={select} quantity={value=>change({...state,value})} disabled={disabled}/>
    <div className="scene-object-controls" role="group" aria-label="Explore the numbered objects">{block.nodes.map((item, i) => <button type="button" key={i} disabled={disabled} aria-pressed={state.selected === i} onClick={() => select(i)}><span aria-hidden="true">{i + 1}. </span>{item.label}</button>)}</div>
    {scene.kind === "quantity" && <div className="scene-quantity"><label htmlFor={id}>Change the number of selected equal parts</label><input id={id} type="range" disabled={disabled} min={0} max={node.total} step={1} value={state.value} aria-valuetext={`${state.value} of ${node.total} equal parts selected`} onChange={e => change({ ...state, value: Number(e.target.value) })}/><p><strong>{state.value}/{node.total}</strong> selected, with <strong>{node.parts}/{node.total}</strong> shown in the worked example.</p></div>}
    <div className="scene-observation" aria-live="polite" aria-atomic="true"><p className="eyebrow">Observe what this part means</p><h3>{node.label}</h3><p>{node.detail}</p>{scene.connections.filter(edge => edge.source === state.selected || edge.target === state.selected).map((edge, i) => <p key={i}><strong>{block.nodes[edge.source].label} → {block.nodes[edge.target].label}</strong>: {edge.label}</p>)}</div>
    <details><summary>Read the scene and its connections as text</summary><ol>{block.nodes.map((item, i) => <li key={i}><strong>{item.label}</strong>: {item.detail}</li>)}</ol>{scene.connections.map((edge, i) => <p key={i}>{block.nodes[edge.source].label} → {block.nodes[edge.target].label}: {edge.label}</p>)}</details>
    <figcaption>Exploring helps you understand the idea, while your explanation and practice provide the evidence for feedback.</figcaption>
  </figure>;
}
