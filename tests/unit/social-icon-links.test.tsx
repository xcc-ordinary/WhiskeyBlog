import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { SocialIconLinks } from "@/components/exhibition/social-icon-links";

describe("SocialIconLinks", () => {
  it("exposes the available external profiles from the About page", () => {
    render(<SocialIconLinks />);

    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/xcc-ordinary");
    expect(screen.getByRole("link", { name: "小红书" })).toHaveAttribute("href", "https://www.xiaohongshu.com/user/profile/63d36fd60000000027029781?tab=note&subTab=note");
    expect(screen.getByRole("link", { name: "发送邮件" })).toHaveAttribute("href", "mailto:1661767494@qq.com");
  });
});
