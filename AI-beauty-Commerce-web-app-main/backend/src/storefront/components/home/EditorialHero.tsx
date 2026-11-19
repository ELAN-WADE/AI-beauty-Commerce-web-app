import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import { FaceScanIcon } from '../common/FaceScanIcon';
import { FlexCarousel } from '../ui/FlexCarousel';
import { HERO_TARGETS } from '../../lib/hero-settings';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';
import type { ScreenId } from '../../types';

interface EditorialHeroProps { onShopClick: () => void; onScanClick: () => void; }
export const EditorialHero: React.FC<EditorialHeroProps> = ({ onShopClick, onScanClick }) => {
  const { heroSlides, heroSettings: settings, navigateTo, setSelectedCategory } = useApp();
  const published = heroSlides.filter(slide => slide.isActive && slide.image).sort((a, b) => (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0));
  const flexImages = published.length ? published.map(slide => ({ src: slide.image, alt: slide.headline || settings.heading })) : [1, 2, 3].map(number => ({ src: '/hero_slide_' + number + '.jpg', alt: 'Desla brand editorial ' + number }));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(query.matches);
    const visibility = () => setVisible(!document.hidden);
    change(); query.addEventListener('change', change); document.addEventListener('visibilitychange', visibility);
    return () => { query.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (settings.mode !== 'slideshow' || published.length < 2 || paused || hovered || reducedMotion || !visible) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % published.length), settings.intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [settings.mode, settings.intervalSeconds, published.length, paused, hovered, reducedMotion, visible]);
  const current = published[index % Math.max(1, published.length)];
  const go = (route = settings.actionRoute, category?: string) => {
    if (category) setSelectedCategory(category);
    if (route === 'catalogue') onShopClick();
    else if (route === 'ai-scan') onScanClick();
    else if (HERO_TARGETS.includes(route as typeof settings.actionRoute)) navigateTo(route as ScreenId);
  };
  if (settings.mode === 'slideshow' && current) return <section aria-label="Editorial Brand Hero" aria-roledescription="carousel" className="relative w-full h-[360px] sm:h-[440px] lg:h-[500px] bg-[#0F0F10] overflow-hidden" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}>
    {published.map((slide, position) => <img key={slide.id} src={slide.image} alt={slide.headline || settings.heading} aria-hidden={position !== index % published.length} style={{ opacity: position === index % published.length ? 1 : 0, transition: "opacity 250ms var(--ease-out)" }} className="absolute inset-0 h-full w-full object-cover" loading={position === index % published.length || position === (index + 1) % published.length ? 'eager' : 'lazy'} fetchPriority={position === 0 ? 'high' : 'auto'} />)}
    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
    <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-6 sm:px-12 text-white">
      <div role="group" aria-roledescription="slide" aria-label={'Slide ' + (index % published.length + 1) + ' of ' + published.length} className="max-w-lg">
        <motion.h1
          key={`slide-h1-${current.id}`}
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: DESLA_EASE_OUT }}
          className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight"
        >
          {current.headline || settings.heading}
        </motion.h1>
        <motion.p
          key={`slide-sub-${current.id}`}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.06, ease: DESLA_EASE_OUT }}
          className="text-sm sm:text-base font-normal text-white/90 mt-3"
        >
          {current.subtext || settings.body}
        </motion.p>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.11, ease: DESLA_EASE_OUT }}
        >
          <button type="button" onClick={() => go((current.actionRoute || settings.actionRoute) as typeof settings.actionRoute, current.actionCategory)} className="inline-flex gap-2 items-center mt-5 rounded-full bg-white text-[#0F0F10] px-6 py-3 text-sm font-semibold active-press cursor-pointer">{current.actionLabel || settings.actionLabel}<ArrowRight size={15} weight="bold" aria-hidden="true" /></button>
        </motion.div>
      </div>
    </div>
    {published.length > 1 && <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3 text-white">
      <button aria-label="Previous slide" type="button" onClick={() => setIndex(value => (value + published.length - 1) % published.length)}><CaretLeft size={18} weight="bold" aria-hidden="true" /></button>
      {published.map((slide, position) => <button key={slide.id} type="button" aria-label={'Show slide ' + (position + 1)} aria-pressed={index % published.length === position} onClick={() => setIndex(position)} className={'w-3 h-3 rounded-full border border-white ' + (index % published.length === position ? 'bg-white' : 'bg-black/30')} />)}
      <button aria-label="Next slide" type="button" onClick={() => setIndex(value => (value + 1) % published.length)}><CaretRight size={18} weight="bold" aria-hidden="true" /></button>
      {!reducedMotion && <button type="button" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={18} weight="fill" aria-hidden="true" /> : <Pause size={18} weight="fill" aria-hidden="true" />}</button>}
    </div>}
  </section>;
  return <section aria-label="Editorial Brand Hero" className="relative bg-[#FAF9F6] border-b border-[#E5E7EB]/70 overflow-hidden pt-5 sm:pt-7 pb-2">
    <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
      <motion.h1
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: DESLA_EASE_OUT }}
        className="font-heading font-bold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight leading-tight"
      >
        {settings.heading}
      </motion.h1>
      <motion.p
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, delay: 0.06, ease: DESLA_EASE_OUT }}
        className="font-body text-xs sm:text-sm font-normal text-[#8B6E27] mt-1.5"
      >
        {settings.body}
      </motion.p>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.11, ease: DESLA_EASE_OUT }}
        className="flex flex-wrap items-center justify-center gap-2.5 pt-3.5"
      >
        <button type="button" onClick={() => go()} className="px-5 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold flex items-center gap-1.5 active-press cursor-pointer"><span className="lg:hidden">Shop now</span><span className="hidden lg:inline">{settings.actionLabel}</span><ArrowRight size={12} weight="bold" className="text-[#D4AF37]" aria-hidden="true" /></button>
        <button type="button" onClick={onScanClick} className="px-4 py-2 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] text-xs font-medium flex items-center gap-1.5 active-press cursor-pointer"><FaceScanIcon size={13} className="text-[#8B6E27]" />AI Skin Assessment</button>
      </motion.div>
    </div>
    {<div className="w-full relative h-[300px] sm:h-[350px] lg:h-[390px] overflow-hidden select-none">
      <FlexCarousel items={flexImages} preset="ribbon" curl="twist" bend={0.34} reach={0.34} lensWidth={0.88} dispersion={0.35} cardHeight={0.64} gap={16} radius={14} fit="portrait" captions={false} autoplay={!reducedMotion && visible} interval={settings.intervalSeconds} squeeze={0.16} className="w-full h-full" />
    </div>}
  </section>;
};
export default EditorialHero;
