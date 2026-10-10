// A conservative aid for explicit Q:/A: pairs. Other valid formats remain assessor-reviewed.
export function responseInspection(response: string) {
  const lines=response.split(/\r?\n/);const entries:{words:number}[]=[];
  let question:string|null=null;let answer:string[]=[];let started=false;let invalid=false;
  const unparsed=()=>({state:"unparsed" as const,rule:"Incomplete or non-explicit Q:/A: format. Review the submitted format directly."});
  const finish=()=>{
    if(question !== null){const text=answer.join(" ").trim();if(!started || !text)invalid=true;else entries.push({words:text.split(/\s+/).length});}
    question=null;answer=[];started=false;
  };
  for(const line of lines){
    const q=/^\s*Q:\s*(.+)$/.exec(line);const a=/^\s*A:\s*(.*)$/.exec(line);
    if(q){finish();question=q[1];}
    else if(a){if(question === null || started)return unparsed();started=true;answer.push(a[1]);}
    else if(/^\s*[QA]:/.test(line))return unparsed();
    else if(line.trim()){if(question === null || !started)return unparsed();answer.push(line.trim());}
  }
  finish();
  return !invalid && entries.length ? {state:"parsed" as const,entryCount:entries.length,answerWordCounts:entries.map(e=>e.words),withinLengthLimit:entries.every(e=>e.words<30),rule:"Whitespace-separated answer tokens, questions and labels excluded. Exactly 30 fails."} : unparsed();
}
