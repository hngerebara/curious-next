import { afterEach, expect, it } from "vitest";
import { learningScene, visualSceneRequired } from "../src/domain/learning-scene-policy";
import { tutorLesson, publicTutorSession } from "../src/domain/tutor-lesson-policy";
import { lessonFixture, lessonHarness } from "./tutor-lesson-harness";
import { closeTutorHarnesses } from "./tutor-harness";
afterEach(closeTutorHarnesses);

it("requires connected bounded scene data and a real whole for quantities", () => {
  const lesson=lessonFixture(),block=lesson.blocks[1],scene=block.scene!;
  expect(learningScene(scene,block)).toEqual(scene);
  const roleIndependent=lessonFixture();roleIndependent.blocks[2].kind="example";
  expect(tutorLesson(roleIndependent,[]).blocks[2].scene?.kind).toBe("quantity");
  expect(()=>learningScene({...scene,connections:[]},block)).toThrow("MODEL_INVALID");
  expect(()=>learningScene({...scene,connections:[{source:0,target:9,label:"Invalid destination"}]},block)).toThrow("MODEL_INVALID");
  expect(()=>learningScene({...scene,kind:"quantity",connections:[]},block)).toThrow("MODEL_INVALID");
  expect(()=>learningScene({...scene,html:"<script>execute()</script>"},block)).toThrow("MODEL_INVALID");
});
it("preserves legacy content but refuses visually led generation without scenes", async () => {
  const lesson=lessonFixture();for(const block of lesson.blocks)delete block.scene;
  expect(tutorLesson(lesson,[])).toEqual(lesson);
  expect(()=>visualSceneRequired(lesson.blocks)).toThrow("MODEL_VISUAL_REQUIRED");
  const h=await lessonHarness({async lesson(){return lesson;}});
  const saved=await h.lessonService.generate("learner-a",h.path.id,h.path.proposal!.modules[0].id,"fictional-missing-scenes");
  expect(saved.state).toBe("failed");expect(saved.lesson).toBeNull();expect(saved.generation.code).toBe("MODEL_VISUAL_REQUIRED");
},15000);
it("restores scene experiments without granting evidence or exposing private keys", async () => {
  const h=await lessonHarness();let saved=await h.lessonService.generate("learner-a",h.path.id,h.path.proposal!.modules[0].id,"fictional-scene-request");
  expect(saved.schemaVersion).toBe(3);
  saved=await h.lessonService.save("learner-a",saved.id,saved.revision,{...saved.draft,scenes:{"original-2":{selected:1,explored:[0,1],value:3}}});
  const restored=await h.lessonStore.read("learner-a",saved.id);
  expect(restored?.draft.scenes?.["original-2"].value).toBe(3);
  expect(restored?.evidence).toBeUndefined();
  expect(publicTutorSession(saved).lesson?.activity).not.toHaveProperty("correctIndices");
  await expect(h.lessonService.save("learner-a",saved.id,saved.revision,{...saved.draft,scenes:{"original-2":{selected:1,explored:[1],value:5}}})).rejects.toThrow("INVALID_DRAFT");
  await expect(h.lessonService.save("learner-a",saved.id,saved.revision,{...saved.draft,scenes:{"someone-elses-help-2":{selected:0,explored:[],value:0}}})).rejects.toThrow("INVALID_DRAFT");
},15000);
