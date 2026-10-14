import type { Attempt } from "../contracts/attempt";

export async function submitForFeedback(ports:{save:()=>Promise<Attempt>;freeze:(saved:Attempt)=>Promise<Attempt>;assess:(saved:Attempt)=>Promise<Attempt>;onSaved:(saved:Attempt)=>void}) {
  const saved=await ports.save();
  const submitted=saved.submission ? saved : await ports.freeze(saved);
  ports.onSaved(submitted);
  return ports.assess(submitted);
}
