import { tutorRuntime } from "./tutor-runtime";
const unavailable=()=>Response.json({error:{code:"UNAVAILABLE"}},{status:503,headers:{"Cache-Control":"no-store"}});
export async function tutorPathsRoute(request:Request) { try{return await tutorRuntime()(request);}catch{return unavailable();} }
export async function tutorPathRoute(request:Request,context:{params:Promise<{id:string}>}) { try{return await tutorRuntime()(request,(await context.params).id);}catch{return unavailable();} }
export async function tutorActionRoute(request:Request,context:{params:Promise<{id:string;action:string}>}) { try{const {id,action}=await context.params;return await tutorRuntime()(request,id,action);}catch{return unavailable();} }
