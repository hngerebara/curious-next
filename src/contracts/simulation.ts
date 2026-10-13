export const simulationActions = ["verify", "use-link", "send-password", "report-known", "delete", "continue-routine"] as const;
export type SimulationAction = typeof simulationActions[number];
export type SimulationChoices = { request: SimulationAction[]; routine: SimulationAction[] };
export function choices(text: string): SimulationChoices | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join() !== "request,routine") return null;
    const record = value as Record<string, unknown>;
    for (const id of ["request", "routine"]) {
      const selected = record[id];
      if (!Array.isArray(selected) || selected.length < 1 || selected.length > 6 || new Set(selected).size !== selected.length || selected.some(a=>!simulationActions.includes(a))) return null;
    }
    return value as SimulationChoices;
  } catch { return null; }
}
