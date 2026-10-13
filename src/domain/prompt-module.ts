import type { Attempt, Draft, ExplanationLevel, Task } from "../contracts/attempt";

export function promptTask(mode: Attempt["mode"], scenario = 0): Task {
  const practice = mode === "practice";
  const packs = [
    ["Northstar Study Club", "Tuesdays", "18:00", "online", "45", "no fee"],
    ["Lakeside Study Club", "Thursdays", "19:00", "online", "30", "a fictional fee of 500 naira"],
    ["Maple Study Club", "Saturdays", "10:00", "at the fictional Maple Hall", "60", "no fee"],
    ["Cedar Study Club", "Mondays", "17:00", "online", "40", "a fictional fee of 200 naira"],
    ["Harbour Study Club", "Wednesdays", "18:30", "online", "50", "no fee"],
    ["Willow Study Club", "Fridays", "16:00", "at the fictional Willow Hall", "35", "no fee"],
    ["Orchard Study Club", "Sundays", "14:00", "online", "55", "a fictional fee of 300 naira"],
    ["Summit Study Club", "Tuesdays", "12:00", "online", "25", "no fee"],
    ["Meadow Study Club", "Thursdays", "15:00", "at the fictional Meadow Hall", "40", "no fee"],
    ["Brook Study Club", "Saturdays", "11:00", "online", "45", "a fictional fee of 400 naira"],
    ["Elm Study Club", "Mondays", "19:30", "online", "30", "no fee"],
    ["Pine Study Club", "Wednesdays", "16:30", "at the fictional Pine Hall", "60", "no fee"],
  ];
  const original = packs[scenario];
  const pack = original && mode === "transfer" ? [`${original[0].split(" ")[0]} Community Workshop`, ...original.slice(1)] : original;
  if (!practice && !pack) throw new Error("FRESH_TASKS_EXHAUSTED");
  return {
    family: mode === "transfer" ? "community-event" : "study-club",
    version: mode === "transfer" ? `${pack[0].split(" ")[0].toLowerCase()}-workshop-transfer-v3` : practice ? "river-cafe-practice-v2" : `${pack[0].split(" ")[0].toLowerCase()}-proof-v2`, objectiveId: "AI-2", rubricVersion: "AI-2-v2", policyVersion: "pilot-v1", status: "preview",
    title: practice ? "River Cafe FAQ practice" : `${pack[0]} proof`,
    source: practice ? "Fictional River Cafe opens Monday to Saturday, 08:00 to 17:00, serves vegetarian lunch and accepts walk-ins. Delivery policy is unspecified." : `Fictional ${pack[0]} meets ${pack[1]} at ${pack[2]} ${pack[3]}, welcomes adult beginners, runs ${pack[4]}-minute sessions and charges ${pack[5]}. Recording policy is unspecified.`,
    brief: `Create exactly three FAQ entries for prospective ${practice ? "customers, covering opening times, lunch/walk-ins and whether delivery is available" : mode === "transfer" ? "workshop attendees, covering meeting time/location, duration/fee and whether sessions are recorded" : "members, covering meeting time/location, duration/fee and whether sessions are recorded"}. Each answer must have fewer than 30 words. Use only the supplied source. State that the source does not provide the ${practice ? "delivery" : "recording"} policy. Run your prompt in Practice AI, inspect the actual output, and explain your choices. Your checklist must check count, answer length, source fidelity and the missing policy. Model mistakes do not automatically fail your work when you accurately identify them.`,
    criteria: [
      { id: "A1", title: "Task", standard: "Requests three FAQ entries for the specified audience covering all three brief topics.", remediation: "Practise stating the task and audience." },
      { id: "A2", title: "Context", standard: "Includes or explicitly references the supplied task source pack.", remediation: "Practise supplying source context." },
      { id: "A3", title: "Constraints", standard: "Specifies fewer than 30 words per answer, source-only information and acknowledgement of the missing policy.", remediation: "Practise writing the missing constraint." },
      { id: "A4", title: "Format", standard: "Requests question-and-answer pairs, with no prescribed markup style.", remediation: "Practise specifying the output format." },
      { id: "A5", title: "Inspection", standard: "Checklist accurately checks count, answer length, source fidelity and uncertainty against the actual response. Accurate detection of model noncompliance meets this criterion.", remediation: "Compare the actual response with each requirement." },
      { id: "A6", title: "Reasoning", standard: "Explains how instructions meet the brief and why verification remains necessary.", remediation: "Explain why you must still verify the output." },
    ],
  };
}
export function lessonText(level: ExplanationLevel) {
  const core = "A prompt is the instruction you give an AI system. State the task, supply relevant context, set constraints and specify a format. More words do not automatically make it better. Instructions do not guarantee compliance or accuracy. Check the actual response against the brief and source.";
  const extra = {
    "very-simple": "Tell the AI what you need. Give it useful facts. Explain the limits. Say how the answer should look. Read what it gives back and check it.",
    beginner: "Task means what to produce. Context means the useful facts. Constraints are limits, such as length and source-only claims. Format is the structure, such as question-and-answer pairs.",
    standard: "Separate the requested output from the source facts. State the audience and coverage. Explicitly require uncertainty for missing information, then check count, length and source fidelity.",
    technical: "Specify output cardinality, audience, source grounding, missing-information handling and representation. Validate the response against each requirement. Fluent text is not evidence of factual compliance.",
  };
  return core + "\n\n" + extra[level] + "\n\nExample: Using only the supplied fictional cafe facts, write four customer FAQ entries as question-and-answer pairs, each answer under 35 words. Flag questions the facts cannot answer. The example illustrates prompt structure, your task brief has its own requirements.";
}
export function helpText(kind: "hint" | "worked_solution", task: Task) {
  return kind === "hint" ? "What must the response produce? Which facts, limits and missing information does the brief require? Compare each instruction with the brief, then inspect the response. A prompt never guarantees correctness." : `Worked practice structure: Using the supplied task source pack, create exactly three FAQ entries for the audience and three topics in the brief. Use question-and-answer pairs. Keep each answer below 30 words. Use only the source facts and explicitly state when a policy is not supplied. Source pack: ${task.source}. Check the actual output before writing your checklist and explanation.`;
}
export function validDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).sort().join() === "checklist,explanation,prompt" && ["prompt", "checklist", "explanation"].every(k => typeof v[k] === "string" && (v[k] as string).length <= (k === "prompt" ? 4000 : 2000));
}
