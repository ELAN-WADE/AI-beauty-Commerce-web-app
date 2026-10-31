import type { ScreenId } from '../types';
export const publicScreenLoaders = {
  search: () => import('../screens/catalog/Screen04Search'),
  categories: () => import('../screens/catalog/Screen05Categories'),
  community: () => import('../screens/community/ScreenCommunityChat'),
  'ai-scan': () => import('../screens/ai/Screen14AISkinScan'),
  account: () => import('../screens/account/Screen17Account'),
};
export function preparePublicScreen(screen: ScreenId) {
  const load = publicScreenLoaders[screen as keyof typeof publicScreenLoaders];
  if (load) void load().catch(() => {});
}
