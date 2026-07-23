import { describe, expect, it } from "vitest";

import { nextTheme } from "@/lib/theme";

describe("nextTheme", () => {
  it("cycles system, light, dark", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});
