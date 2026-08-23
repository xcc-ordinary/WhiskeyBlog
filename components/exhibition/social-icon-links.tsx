import type { JSX } from "react";

import { xiaohongshuLink } from "@/lib/exhibition";
import { site } from "@/lib/site";

type IconName = "github" | "xiaohongshu" | "email";

const links: Array<{ href: string; label: string; icon: IconName; external?: boolean }> = [
  { href: "https://github.com/xcc-ordinary", label: "GitHub", icon: "github", external: true },
  { href: xiaohongshuLink.href, label: "小红书", icon: "xiaohongshu", external: true },
  { href: `mailto:${site.email}`, label: "发送邮件", icon: "email" },
];

function SocialIcon({ name }: { name: IconName }): JSX.Element {
  if (name === "github") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9 19c-4.5 1.4-4.5-2.3-6.3-2.8m12.6 5.1v-3.5c0-1 .1-1.5-.5-2.1 2.8-.3 5.7-1.4 5.7-6.2A4.8 4.8 0 0 0 19.2 6a4.5 4.5 0 0 0-.1-3.4s-1-.3-3.6 1.3a12.4 12.4 0 0 0-6.5 0C6.5 2.3 5.4 2.6 5.4 2.6A4.5 4.5 0 0 0 5.3 6 4.8 4.8 0 0 0 4 9.5c0 4.8 2.9 5.9 5.7 6.2-.5.5-.6 1.1-.5 2.1v3.5" />
      </svg>
    );
  }

  if (name === "xiaohongshu") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect height="17" rx="4" width="19" x="2.5" y="3.5" />
        <path d="M7 8.2h10M7 12h10M7 15.8h6.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect height="15" rx="2" width="20" x="2" y="4.5" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

export function SocialIconLinks(): JSX.Element {
  return (
    <nav aria-label="社交链接" className="about-social-links">
      <span>FIND ME ELSEWHERE</span>
      <div>
        {links.map((link) => (
          <a
            aria-label={link.label}
            href={link.href}
            key={link.label}
            rel={link.external ? "noreferrer" : undefined}
            target={link.external ? "_blank" : undefined}
            title={link.label}
          >
            <SocialIcon name={link.icon} />
          </a>
        ))}
      </div>
    </nav>
  );
}
