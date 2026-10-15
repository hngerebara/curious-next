import type { LessonBlock } from "../contracts/tutor-lesson";
import type { LearningScene, SceneState } from "../contracts/learning-scene";

export function TutorSceneArt({ block, scene, state }: { block: LessonBlock; scene: LearningScene; state: SceneState }) {
  const count = block.nodes.length;
  const points = block.nodes.map((_, i) => scene.kind === "sequence" ? { x: 70 + i * (500 / Math.max(1, count - 1)), y: 155 + (i % 2) * 28 } : { x: 320 + Math.cos(i * Math.PI * 2 / count - Math.PI / 2) * 205, y: 165 + Math.sin(i * Math.PI * 2 / count - Math.PI / 2) * 100 });
  const node = block.nodes[state.selected];
  return <svg viewBox="0 0 640 340" className="learning-scene-art" role="img" aria-label={scene.kind === "quantity" ? `${state.value} selected equal parts of ${node.total}, with ${node.parts} parts in the worked example` : `${block.title}, with ${count} numbered objects and ${scene.connections.length} labelled connections. The selected object is ${state.selected + 1}.`}>
    <path fill="#e4dbf1" d="M0 175Q150 60 320 165T640 135V340H0Z"/><path fill="#dce8c4" d="M0 265Q150 185 330 270T640 230V340H0Z"/>
    {scene.kind === "quantity" ? <g>{Array.from({ length: node.total }, (_, i) => { const width = 500 / node.total, x = 70 + i * width, y = 100; return <g key={i}><rect x={x} y={y} width={width} height="140" rx="0" fill={i < state.value ? "#c5ef42" : "#fffdf7"} stroke="#292b24" strokeWidth="2"/><text x={x + width / 2} y={y + 78} textAnchor="middle" fontSize="24" fill="#292b24">{i + 1}</text></g>; })}</g> : <>
      {scene.connections.map((edge, i) => { const from = points[edge.from], to = points[edge.to]; return <g key={i}><path d={`M${from.x} ${from.y} L${to.x} ${to.y}`} stroke={state.selected === edge.from || state.selected === edge.to ? "#393b2c" : "#aaa28a"} strokeWidth="4" fill="none"/><circle cx={to.x * .8 + from.x * .2} cy={to.y * .8 + from.y * .2} r="5" fill="#393b2c"/></g>; })}
      {scene.kind === "scenario" && <g transform="translate(295 135)"><rect width="50" height="70" rx="22" fill="#c5ef42" stroke="#292b24" strokeWidth="2"/><circle cx="17" cy="25" r="3"/><circle cx="33" cy="25" r="3"/><path d="M18 43Q25 50 32 43" fill="none" stroke="#292b24" strokeWidth="2"/></g>}
      {points.map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y})`}><ellipse cy="34" rx="40" ry="10" fill="#aab492"/><rect x="-30" y="-30" width="60" height="60" rx={scene.kind === "comparison" ? 8 : 30} fill={state.selected === i ? "#c5ef42" : "#fffdf7"} stroke="#292b24" strokeWidth={state.selected === i ? 4 : 2}/><text textAnchor="middle" y="8" fontSize="25" fill="#292b24">{i + 1}</text></g>)}
    </>}
  </svg>;
}
