import { useEffect, useId, useRef } from "react";
export function TutorLeaveDialog({answer}:{answer:(leave:boolean)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),title=useId(),restoreFocus=useRef(true);
 const respond=(leave:boolean)=>{restoreFocus.current=!leave;answer(leave);};
 useEffect(()=>{const previous=document.activeElement;dialog.current?.showModal();return()=>{dialog.current?.close();if(restoreFocus.current && previous instanceof HTMLElement && previous.isConnected)previous.focus();};},[]);
 return <dialog className="tutor-leave-dialog" ref={dialog} aria-labelledby={title} onCancel={event=>{event.preventDefault();respond(false);}}><h2 id={title}>Your work has edits that have not been saved</h2><p>Keep editing to preserve these changes, or discard them before continuing to another screen.</p><div className="tutor-step-actions"><button autoFocus onClick={()=>respond(false)}>Keep editing</button><button className="secondary-button" onClick={()=>respond(true)}>Discard edits and continue</button></div></dialog>;
}
