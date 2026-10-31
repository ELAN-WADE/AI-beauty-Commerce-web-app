import type { HeroSlide, EditorialRoutineStep, BrandStoryConfig, AnnouncementTickerConfig } from '../types';
import type { HeroSettings } from './hero-settings';
export interface StorefrontSeed {
  version: number;
  config: { hero: HeroSettings; heroSlides: HeroSlide[]; routineSteps: EditorialRoutineStep[]; brandStory: BrandStoryConfig; announcementTicker: AnnouncementTickerConfig } | null;
}
