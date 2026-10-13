import type { Draft, EvidenceField } from "../contracts/attempt";

// Narrow literal aid for an explicit endorsed belief, not a general natural-language classifier.
// Quoted, historical, rejected and contradictory declarations stay with the assessor as candidates.
export function brandingEndorsement(draft: Draft): {field: EvidenceField; quote: string; start: number; end: number} | null {
  if (/\b(used to|not true|reject|wrong|false belief|incorrect|does not|doesn't)\b/i.test(draft.checklist+"\n"+draft.explanation)) return null;
  for (const field of ["checklist","explanation"] as const) {
    const text = draft[field];
    for (const sentence of text.split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim())) {
      if (!sentence || sentence.length>600) continue;
      if (!/^(?:I (?:think|believe) (?:the|its|a|this) (?:familiar )?logo|(?:The|A|This|Its) (?:familiar )?logo) (?:proves|confirms|guarantees) (?:that )?(?:the (?:sender|message)|it|this) is (?:authentic|genuine)\b/i.test(sentence)) continue;
      const start = text.indexOf(sentence);
      return {field,quote:sentence,start,end:start+sentence.length};
    }
  }
  return null;
}

export function blanketPhishingClaim(draft: Draft): {field: EvidenceField; quote: string; start: number; end: number} | null {
  if (/\b(used to|not true|reject|wrong|false belief|incorrect)\b/i.test(draft.checklist+"\n"+draft.explanation)) return null;
  for (const field of ["checklist","explanation"] as const) {
    const text = draft[field];
    for (const sentence of text.split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim())) {
      if (sentence.length>600 || !/^All (?:messages|emails) are (?:definitely|certainly) phishing\b/i.test(sentence)) continue;
      const start=text.indexOf(sentence);
      return {field,quote:sentence,start,end:start+sentence.length};
    }
  }
  return null;
}
