"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

function applySize(size:number){document.documentElement.style.fontSize=size+"%";document.documentElement.toggleAttribute("data-large-text",size>100);}
const DisplayContext=createContext({size:100,change:(_size:number)=>{}});
export function DisplayPreferences({children}:{children:ReactNode}) {
  const [size,setSize]=useState(100);
  useEffect(()=>{
    try {
      const saved=Number(localStorage.getItem("curiousnext-text-size"));
      if([100,150,200].includes(saved)){setSize(saved);applySize(saved);}
    }catch { /* Browser storage is optional. */ }
  },[]);
  function change(next:number){
    if(![100,150,200].includes(next))return;
    setSize(next);applySize(next);
    try{localStorage.setItem("curiousnext-text-size",String(next));}catch { /* The current page still resizes. */ }
  }
  return <DisplayContext.Provider value={{size,change}}>{children}</DisplayContext.Provider>;
}
export function TextSizeControl(){
  const {size,change}=useContext(DisplayContext);
  return <><label htmlFor="text-size">Text size</label><select id="text-size" value={size} onChange={event=>change(Number(event.target.value))}><option value={100}>Standard</option><option value={150}>Larger (150%)</option><option value={200}>Largest (200%)</option></select></>;
}
