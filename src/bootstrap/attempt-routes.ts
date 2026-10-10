import { attemptRuntime } from "./attempt-runtime";
const unavailable=()=>Response.json({error:{code:"UNAVAILABLE"},requestId:crypto.randomUUID()},{status:503,headers:{"Cache-Control":"no-store"}});
export async function learningRoute(request:Request){try{return await attemptRuntime()(request);}catch{return unavailable();}}
export async function attemptRoute(request:Request,context:{params:Promise<{id:string}>}){try{return await attemptRuntime()(request,(await context.params).id);}catch{return unavailable();}}
export async function attemptActionRoute(request:Request,context:{params:Promise<{id:string;action:string}>}){try{const params=await context.params;return await attemptRuntime()(request,params.id,params.action);}catch{return unavailable();}}
