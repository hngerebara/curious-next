import { useEffect, useState } from "react";
export function useTutorLease(until:number){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const delay=Math.max(0,until-Date.now());if(!delay){setNow(Date.now());return;}const timer=window.setTimeout(()=>setNow(Date.now()),delay+25);return()=>window.clearTimeout(timer);},[until]);
 return until>now;
}
