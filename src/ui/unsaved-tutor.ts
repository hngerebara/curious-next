import { createElement, useEffect, useRef, useState } from "react";
import { TutorLeaveDialog } from "./tutor-leave-dialog";
export function useUnsavedTutor(dirty:boolean){
 const accepted=useRef(false);
 const [pending,setPending]=useState<{resolve:(leave:boolean)=>void}|null>(null);
 function confirm(){if(!dirty)return Promise.resolve(true);return new Promise<boolean>(resolve=>setPending({resolve}));}
 useEffect(()=>{return()=>pending?.resolve(false);},[pending]);
 useEffect(()=>{
  const warn=(event:BeforeUnloadEvent)=>{if(dirty && !accepted.current){event.preventDefault();event.returnValue="";}};
  const navigate=async(event:MouseEvent)=>{
   const target=event.target instanceof Element?event.target.closest("a[href]"):null;
   if(!dirty || !target || event.ctrlKey || event.metaKey || target.getAttribute("target")==="_blank")return;
   const url=new URL(target.getAttribute("href")!,window.location.href);
   if(url.origin===window.location.origin && url.pathname===window.location.pathname && url.search===window.location.search)return;
   event.preventDefault();event.stopPropagation();if(await confirm()){accepted.current=true;window.location.assign(url.href);}
  };
  window.addEventListener("beforeunload",warn);document.addEventListener("click",navigate,true);
  return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",navigate,true);};
 },[dirty]);
 return {confirm,dialog:pending?createElement(TutorLeaveDialog,{answer:(leave:boolean)=>{pending.resolve(leave);setPending(null);}}):null};
}
