import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { LanguageProvider } from "@/components/language-provider";
import { CoastalEdition } from "@/components/exhibition/coastal-edition";
it("does not resurrect removed projects through the homepage's dedicated feature sections", () => {
  const html = renderToStaticMarkup(<LanguageProvider><CoastalEdition projects={[]} openRoom={() => {}} tone={0} setTone={() => {}} /></LanguageProvider>);
  expect(html).not.toContain('data-room-trigger="dreambook"');
  expect(html).not.toContain('data-room-trigger="lumi"');
  expect(html).not.toContain('id="selected-work"');
  expect(html).toContain('class="edition-life"');
});
