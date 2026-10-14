import { useState } from "react";
import type { TutorGoal, TutorPreferences, TutorPublicPath } from "../contracts/tutor";
import { TutorSetupForm } from "./tutor-setup-form";
export function TutorPreferencesEditor({path,busy,save,onDirty}:{path:TutorPublicPath;busy:boolean;save:(preferences:TutorPreferences)=>void;onDirty:(dirty:boolean)=>void}){
 const [goal,setGoal]=useState<TutorGoal>({...path.goal,preferences:path.preferences ?? path.goal.preferences});const dirty=JSON.stringify(goal.preferences)!==JSON.stringify(path.preferences ?? path.goal.preferences);
 return <details onToggle={event=>{if(!event.currentTarget.open && dirty)event.currentTarget.open=true;}}><summary>Change how future lessons are explained</summary><p>These preferences apply to future lessons, while saved lessons keep their original content and criteria.</p><TutorSetupForm goal={goal} setGoal={value=>{setGoal(value);onDirty(JSON.stringify(value.preferences)!==JSON.stringify(path.preferences ?? path.goal.preferences));}} step="preferences" busy={busy} next={()=>{}} back={()=>{setGoal({...path.goal,preferences:path.preferences ?? path.goal.preferences});onDirty(false);}} generate={()=>save(goal.preferences)} actionLabel="Save teaching preferences"/></details>;
}
