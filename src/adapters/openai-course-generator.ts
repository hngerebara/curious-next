import type { CourseGenerator } from "../contracts/course-plan";
import { eligibleIntent } from "../domain/course-policy";
import { intentRules, requiredObjectives } from "../domain/course-catalogue";
import { courseInstruction, courseSchema } from "./course-model-contract";
import { openaiResponse, openaiConfiguration } from "./openai-response";

export function openaiCourseGenerator(key:string|undefined,model:string|undefined,transport:typeof fetch=fetch):CourseGenerator {
  return {configuration:openaiConfiguration(model,"course",courseInstruction,courseSchema,2500),async generate(input,catalogue) {
    if(!key || !model)throw Error("GENERATOR_NOT_CONFIGURED");
    const expectedIntent=eligibleIntent(input);
    const schema=expectedIntent ? {...courseSchema,properties:{...courseSchema.properties,state:{type:"string",enum:["ready-preview"]},subject:{type:"string",enum:[intentRules[expectedIntent].subject]},intent:{type:"string",enum:[expectedIntent]}}} : courseSchema;
    const intents=Object.entries(intentRules).map(([id,rule])=>({id,subject:rule.subject,outcome:rule.outcome,requiredObjectives:requiredObjectives(id as keyof typeof intentRules,catalogue)}));
    try{return JSON.parse(await openaiResponse(key,model,courseInstruction,{learner:input,catalogue,intents,expectedIntent},schema,2500,transport));}
    catch(error){throw Error(error instanceof Error && error.message === "MODEL_LIMITED" ? "GENERATOR_RATE_LIMITED" : error instanceof Error && error.message === "MODEL_REFUSED" ? "GENERATOR_REFUSED" : error instanceof SyntaxError || error instanceof Error && error.message === "MODEL_INVALID" ? "GENERATOR_INCOMPLETE" : "GENERATOR_UNAVAILABLE");}
  }};
}
