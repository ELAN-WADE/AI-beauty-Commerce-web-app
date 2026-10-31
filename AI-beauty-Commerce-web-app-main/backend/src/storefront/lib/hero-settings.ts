export const HERO_TARGETS = ['catalogue', 'categories', 'search', 'ai-scan', 'creators', 'distributor-portal', 'community'] as const;
export interface HeroSettings {
  mode: 'flex' | 'slideshow'; heading: string; body: string; actionLabel: string;
  actionRoute: typeof HERO_TARGETS[number]; intervalSeconds: number;
}
export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  mode: 'flex', heading: 'Health Before Beauty', body: 'Care for your natural barrier.',
  actionLabel: 'Explore Formulations', actionRoute: 'catalogue', intervalSeconds: 5,
};
export function moveHeroImage<T extends { id: string; displayOrder?: number; order?: number }>(slides: T[], id: string, delta: number): T[] {
  const ordered = [...slides].sort((left, right) => (left.displayOrder ?? left.order ?? 0) - (right.displayOrder ?? right.order ?? 0));
  const from = ordered.findIndex(slide => slide.id === id), to = from + delta;
  if (from < 0 || to < 0 || to >= ordered.length) return slides;
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  return ordered.map((slide, index) => ({ ...slide, displayOrder: index + 1, order: index + 1 }));
}

