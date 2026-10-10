import { expect, it } from "vitest";
import { responseInspection } from "../src/domain/response-inspection";
it("counts answer tokens, excluding Q/A labels and fails exactly thirty",()=>{
 const result=responseInspection(`Q: A long question with words excluded?\nA: ${Array(30).fill("word").join(" ")}`);
 expect(result).toMatchObject({state:"parsed",entryCount:1,answerWordCounts:[30],withinLengthLimit:false});
 expect(responseInspection("Q: Example?\nA: A hyphenated-token counts once.")).toMatchObject({answerWordCounts:[4],withinLengthLimit:true});
});
it("leaves valid alternative formats to judgment rather than assigning learner failure",()=>{expect(responseInspection("### When?\nTuesday online").state).toBe("unparsed");});
