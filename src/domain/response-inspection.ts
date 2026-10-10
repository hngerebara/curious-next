// A conservative aid for explicit Q:/A: pairs. Other valid formats remain assessor-reviewed.
export function responseInspection(response: string) {
  const lines=response.split(/\r?\n/);const entries:{question:string;answer:string;words:number}[]=[];
  let question:string|null=null;let answer:string[]=[];
  const finish=()=>{if(question && answer.length){const text=answer.join(" ").trim();entries.push({question,answer:text,words:text ? text.split(/\s+/).length : 0});}question=null;answer=[];};
  for(const line of lines){
    const q=/^\s*Q:\s*(.+)$/.exec(line);const a=/^\s*A:\s*(.*)$/.exec(line);
    if(q){finish();question=q[1];}else if(a && question){answer.push(a[1]);}else if(question && answer.length && line.trim()){answer.push(line.trim());}else if(line.trim()){return {state:"unparsed" as const,rule:"Whitespace-separated answer tokens, questions and labels excluded. Other formats require review."};}
  }
  finish();
  return entries.length ? {state:"parsed" as const,entryCount:entries.length,answerWordCounts:entries.map(e=>e.words),withinLengthLimit:entries.every(e=>e.words<30),rule:"Whitespace-separated answer tokens, questions and labels excluded. Exactly 30 fails."} : {state:"unparsed" as const,rule:"No explicit Q:/A: pairs. Review the submitted format directly."};
}
