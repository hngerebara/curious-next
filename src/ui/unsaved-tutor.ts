import { useEffect } from "react";
export function useUnsavedTutor(dirty:boolean) {
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue="";}};
    const navigate=(event:MouseEvent)=>{const target=event.target instanceof Element?event.target.closest("a[href]"):null;if(!dirty || !target)return;const url=new URL(target.getAttribute("href")!,window.location.href);if(url.origin===window.location.origin && url.pathname===window.location.pathname && url.search===window.location.search)return;if(!window.confirm("Leave this page and discard your unsaved edits?")){event.preventDefault();event.stopPropagation();}};
    window.addEventListener("beforeunload",warn);document.addEventListener("click",navigate,true);
    return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",navigate,true);};
  },[dirty]);
}
