import { expect, it } from "vitest";
import { currentFacts, homeIdentity, xiaohongshuLink } from "@/lib/exhibition";

it("keeps home identity and external handoff in the exhibition data layer", () => {
  expect(homeIdentity.kicker).toBe("01 / PERSONAL FIELD NOTES");
  expect(currentFacts).toHaveLength(3);
  expect(xiaohongshuLink.href).toMatch(/^https:\/\//);
});
