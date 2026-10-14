import { useEffect, useRef, useState } from "react";
export function TutorReadAloud({text,disabled=false}:{text:string;disabled?:boolean}){
 const [available,setAvailable]=useState(false),[state,setState]=useState<"idle"|"reading"|"paused">("idle"),[message,setMessage]=useState("");
 const current=useRef<SpeechSynthesisUtterance|null>(null);
 useEffect(()=>{setAvailable("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);return()=>{current.current=null;if("speechSynthesis" in window)window.speechSynthesis.cancel();};},[]);
 useEffect(()=>{current.current=null;if("speechSynthesis" in window)window.speechSynthesis.cancel();setState("idle");setMessage("");},[text]);
 useEffect(()=>{if(disabled && current.current){current.current=null;window.speechSynthesis.cancel();setState("idle");}},[disabled]);
 function stop(){current.current=null;window.speechSynthesis.cancel();setState("idle");}
 function read(){
  if(!available)return;
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);current.current=utterance;utterance.lang="en-GB";utterance.rate=.92;
  const voice=window.speechSynthesis.getVoices().find(v=>v.localService && v.lang.startsWith("en"));if(voice)utterance.voice=voice;
  utterance.onend=()=>{if(current.current===utterance){setState("idle");current.current=null;}};
  utterance.onerror=()=>{if(current.current===utterance){setState("idle");setMessage("Reading could not start, so use the transcript or try again.");}};
  setMessage("");setState("reading");window.speechSynthesis.speak(utterance);
 }
 return <div className="tutor-audio"><div className="tutor-inline-actions"><button type="button" className="secondary-button" disabled={!available || disabled} onClick={read}>{state==="idle"?"Read this slide aloud":"Read from the beginning"}</button>{state!=="idle" && <><button type="button" className="text-button" onClick={()=>{if(state==="reading"){window.speechSynthesis.pause();setState("paused");}else{window.speechSynthesis.resume();setState("reading");}}}>{state==="paused"?"Resume reading":"Pause reading"}</button><button type="button" className="text-button" onClick={stop}>Stop reading</button></>}</div><p className="muted" role="status">{!available?"Read-aloud is unavailable in this browser, and the complete transcript remains below.":message || (state==="reading"?"Reading the slide transcript through your browser's speech voice.":state==="paused"?"Reading is paused, and you can resume whenever you are ready.":"Read-aloud uses your browser voice, and it starts only when you choose.")}</p></div>;
}
