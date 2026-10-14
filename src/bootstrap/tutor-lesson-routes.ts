import { tutorLessonRuntime } from "./tutor-lesson-runtime";
const unavailable=()=>Response.json({error:{code:"UNAVAILABLE"}},{status:503,headers:{"Cache-Control":"no-store"}});
export async function tutorSessionsRoute(request:Request){try{return await tutorLessonRuntime()(request);}catch{return unavailable();}}
export async function tutorSessionRoute(request:Request,context:{params:Promise<{id:string}>}){try{return await tutorLessonRuntime()(request,(await context.params).id);}catch{return unavailable();}}
export async function tutorSessionActionRoute(request:Request,context:{params:Promise<{id:string;action:string}>}){try{const {id,action}=await context.params;return await tutorLessonRuntime()(request,id,action);}catch{return unavailable();}}
