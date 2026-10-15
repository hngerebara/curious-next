import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessView } from "../src/ui/access-view";

it("displays only the explicitly public demo password while demo mode is enabled", () => {
  const password = "fictional<&>demo-password";
  const visible = renderToStaticMarkup(createElement(AccessView, { demo: true, demoPassword: password }));
  expect(visible).toContain("Demo password");
  expect(visible).toContain("fictional&lt;&amp;&gt;demo-password");
  expect(visible).toContain("Everyone using this demo shares saved work");
  const emailMode = renderToStaticMarkup(createElement(AccessView, { demo: false, demoPassword: password }));
  expect(emailMode).not.toContain("Demo password");
  expect(emailMode).not.toContain("fictional");
});
