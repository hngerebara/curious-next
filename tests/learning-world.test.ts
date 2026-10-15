import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TutorWorldMap } from "../src/ui/tutor-world-map";
import { TutorScene, initialSceneState } from "../src/ui/tutor-scene";
import { generatedPath, tutorInput } from "./tutor-harness";
import { lessonFixture } from "./tutor-lesson-harness";
import type { TutorPublicPath } from "../src/contracts/tutor";
it("renders navigable destinations without presenting exploration as demonstration", () => {
  const path:TutorPublicPath={id:"fictional",version:1,revision:0,requestKey:"fictional-world-request",goal:tutorInput,configuration:"fixture",state:"accepted",proposal:generatedPath(),acceptedAt:null,placement:null,generation:{count:1,lease:null,until:0,code:null},createdAt:"2026-10-15"};
  const markup=renderToStaticMarkup(createElement(TutorWorldMap,{path,sessions:[],current:"module-0",busy:false,explore(){}}));
  expect(markup).toContain('aria-current="step"');
  expect(markup).toContain("Your recommended next destination");
  expect(markup).not.toContain("Supported practice completed");
  expect(markup).toContain("independent demonstration requires separate evidence");
  expect(markup.match(/world-destination-title/g)).toHaveLength(4);
});
it("renders meaningful equal-share geometry with keyboard controls and equivalent text", () => {
  const block=lessonFixture().blocks[2];
  const markup=renderToStaticMarkup(createElement(TutorScene,{block,scene:{version:1,kind:"quantity",prompt:"Change selected shares and observe how they relate to the whole.",connections:[]},state:initialSceneState(block),change(){}}));
  expect(markup).toContain('type="range"');
  expect(markup).toContain("1 selected equal parts of 2");
  expect(markup).toContain("Read the scene and its connections as text");
  expect(markup).toContain('aria-pressed="true"');
});
