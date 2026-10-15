import type { ReactNode } from "react";
function inline(text:string):ReactNode[]{return text.split(/(`[^`\n]+`)/g).map((part,i)=>part.startsWith("`") && part.endsWith("`")?<code key={i}>{part.slice(1,-1)}</code>:part);}
function proseLines(text:string):string {
 const lines=text.trim().split("\n");
 // Retain intentional steps and lists while joining wrapped prose sentences.
 if(lines.some(line=>/^\s*(?:[-*•]\s|\d+[.)]\s)/.test(line)))return lines.join("\n");
 return lines.map(line=>line.trim()).join(" ");
}
export function TutorProse({text}:{text:string}){
 return <div className="journey-prose">{text.split(/(```[^]*?```)/g).filter(Boolean).map((part,i)=>{
  if(part.startsWith("```") && part.endsWith("```")){const body=part.slice(3,-3).replace(/^[a-zA-Z0-9_-]*\n/,"");return <pre key={i}><code>{body}</code></pre>;}
  return <div key={i}>{part.split(/\n\s*\n/).filter(p=>p.trim()).map((paragraph,j)=><p key={j}>{inline(proseLines(paragraph))}</p>)}</div>;
 })}</div>;
}
