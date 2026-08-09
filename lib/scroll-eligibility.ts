export type ScrollEnvironment = {
  hasHydrated: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
  viewportWidth: number;
};

export function shouldEnhanceScroll(environment: ScrollEnvironment): boolean {
  return (
    environment.hasHydrated &&
    !environment.reducedMotion &&
    !environment.coarsePointer &&
    environment.viewportWidth > 760
  );
}
