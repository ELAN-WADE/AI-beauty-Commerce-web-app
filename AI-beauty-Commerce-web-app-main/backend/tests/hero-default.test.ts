import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_HERO_SETTINGS } from '@/storefront/lib/hero-settings';
const state = vi.hoisted(() => ({ value: {} as any }));
vi.mock('@/storefront/context/AppContext', () => ({ useApp: () => state.value }));
vi.mock('@/storefront/components/ui/FlexCarousel', () => ({ FlexCarousel: ({ items }: { items: { src: string }[] }) => React.createElement('div', { 'data-flex-images': items.map(item => item.src).join(',') }) }));
import { EditorialHero } from '@/storefront/components/home/EditorialHero';
function render(mode: 'flex' | 'slideshow', slides: any[] = []) {
  state.value = { heroSettings: { ...DEFAULT_HERO_SETTINGS, mode }, heroSlides: slides, navigateTo: vi.fn(), setSelectedCategory: vi.fn() };
  return renderToStaticMarkup(React.createElement(EditorialHero, { onShopClick: vi.fn(), onScanClick: vi.fn() }));
}
describe('default hero survives an empty CMS', () => {
  it('keeps the Flex carousel with bundled editorial images before uploads exist', () => {
    const html = render('flex'); expect(html).toContain('data-flex-images');
    for (const number of [1, 2, 3]) expect(html).toContain('/hero_slide_' + number + '.jpg');
  });
  it('uses saved uploaded images in Flex mode', () => {
    expect(render('flex', [{ id: 'saved', image: '/saved-image.jpg', isActive: true }])).toContain('data-flex-images="/saved-image.jpg"');
  });
  it('switches only when slideshow mode and a published image are present', () => {
    expect(render('slideshow')).toContain('data-flex-images');
    const html = render('slideshow', [{ id: 'saved', image: '/saved-image.jpg', isActive: true }]);
    expect(html).toContain('aria-roledescription="carousel"'); expect(html).not.toContain('data-flex-images');
  });
});
