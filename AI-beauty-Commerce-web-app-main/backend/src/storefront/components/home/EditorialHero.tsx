import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import { FaceScanIcon } from '../common/FaceScanIcon';
import { FlexCarousel } from '../ui/FlexCarousel';
import { HERO_TARGETS } from '../../lib/hero-settings';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';
import { useIsMobileSheetViewport } from '../motion/DeslaMobileDrawer';
import type { ScreenId } from '../../types';

interface EditorialHeroProps {
  onShopClick: () => void;
  onScanClick: () => void;
}

const FALLBACK_LOOKBOOK_LABELS = [
  { tag: '01 · Barrier Science', caption: 'Ceramide & Botanical Lipid Care' },
  { tag: '02 · Daily Rituals', caption: 'Skin-First Formulations for Melanin' },
  { tag: '03 · Pure Apothecary', caption: 'Small-Batch Natural Preparations' },
];

export const EditorialHero: React.FC<EditorialHeroProps> = ({ onShopClick, onScanClick }) => {
  const { heroSlides, heroSettings: settings, navigateTo, setSelectedCategory } = useApp();
  const isMobileViewport = useIsMobileSheetViewport(1024);

  const published = heroSlides
    .filter((slide) => slide.isActive && slide.image)
    .sort((a, b) => (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0));

  const flexImages = published.length
    ? published.map((slide, idx) => ({
        src: slide.image,
        alt: slide.headline || settings.heading,
        tag: FALLBACK_LOOKBOOK_LABELS[idx % FALLBACK_LOOKBOOK_LABELS.length].tag,
        caption: slide.headline || FALLBACK_LOOKBOOK_LABELS[idx % FALLBACK_LOOKBOOK_LABELS.length].caption,
        actionRoute: slide.actionRoute,
        actionCategory: slide.actionCategory,
      }))
    : [1, 2, 3].map((number, idx) => ({
        src: '/hero_slide_' + number + '.jpg',
        alt: 'Desla brand editorial ' + number,
        tag: FALLBACK_LOOKBOOK_LABELS[idx].tag,
        caption: FALLBACK_LOOKBOOK_LABELS[idx].caption,
        actionRoute: undefined as string | undefined,
        actionCategory: undefined as string | undefined,
      }));

  const [index, setIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: flexImages.length > 2,
    skipSnaps: false,
  });

  const onEmblaSelect = useCallback(() => {
    if (!emblaApi) return;
    setMobileIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onEmblaSelect();
    emblaApi.on('select', onEmblaSelect);
    emblaApi.on('reInit', onEmblaSelect);
    return () => {
      emblaApi.off('select', onEmblaSelect);
      emblaApi.off('reInit', onEmblaSelect);
    };
  }, [emblaApi, onEmblaSelect]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(query.matches);
    const visibility = () => setVisible(!document.hidden);
    change();
    query.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      query.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (settings.mode !== 'slideshow' || published.length < 2 || paused || hovered || reducedMotion || !visible) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % published.length), settings.intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [settings.mode, settings.intervalSeconds, published.length, paused, hovered, reducedMotion, visible]);

  const current = published[index % Math.max(1, published.length)];
  const go = (route = settings.actionRoute, category?: string) => {
    if (category) setSelectedCategory(category);
    if (route === 'catalogue') onShopClick();
    else if (route === 'ai-scan') onScanClick();
    else if (HERO_TARGETS.includes(route as typeof settings.actionRoute)) navigateTo(route as ScreenId);
  };

  if (settings.mode === 'slideshow' && current) {
    return (
      <section
        aria-label="Editorial Brand Hero"
        aria-roledescription="carousel"
        className="relative w-full h-[360px] sm:h-[440px] lg:h-[500px] bg-[#0F0F10] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
        }}
      >
        {published.map((slide, position) => (
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.headline || settings.heading}
            aria-hidden={position !== index % published.length}
            style={{ opacity: position === index % published.length ? 1 : 0, transition: 'opacity 250ms var(--ease-out)' }}
            className="absolute inset-0 h-full w-full object-cover"
            loading={position === index % published.length || position === (index + 1) % published.length ? 'eager' : 'lazy'}
            fetchPriority={position === 0 ? 'high' : 'auto'}
          />
        ))}
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
              <button
                type="button"
                onClick={() => go((current.actionRoute || settings.actionRoute) as typeof settings.actionRoute, current.actionCategory)}
                className="inline-flex gap-2 items-center mt-5 rounded-full bg-white text-[#0F0F10] px-6 py-3 text-sm font-semibold active-press cursor-pointer"
              >
                {current.actionLabel || settings.actionLabel}
                <ArrowRight size={15} weight="bold" aria-hidden="true" />
              </button>
            </motion.div>
          </div>
        </div>
        {published.length > 1 && (
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3 text-white">
            <button aria-label="Previous slide" type="button" onClick={() => setIndex((value) => (value + published.length - 1) % published.length)}>
              <CaretLeft size={18} weight="bold" aria-hidden="true" />
            </button>
            {published.map((slide, position) => (
              <button
                key={slide.id}
                type="button"
                aria-label={'Show slide ' + (position + 1)}
                aria-pressed={index % published.length === position}
                onClick={() => setIndex(position)}
                className={'w-3 h-3 rounded-full border border-white ' + (index % published.length === position ? 'bg-white' : 'bg-black/30')}
              />
            ))}
            <button aria-label="Next slide" type="button" onClick={() => setIndex((value) => (value + 1) % published.length)}>
              <CaretRight size={18} weight="bold" aria-hidden="true" />
            </button>
            {!reducedMotion && (
              <button type="button" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((value) => !value)}>
                {paused ? <Play size={18} weight="fill" aria-hidden="true" /> : <Pause size={18} weight="fill" aria-hidden="true" />}
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Editorial Brand Hero" className="relative bg-[#FBF9F5] border-b border-[#EAE5DC] overflow-hidden pt-5 sm:pt-7 pb-5 lg:pb-2">
      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <motion.h1
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: DESLA_EASE_OUT }}
          className="font-heading font-bold text-[24px] sm:text-3xl text-[#111111] tracking-tight leading-[1.16]"
        >
          {settings.heading}
        </motion.h1>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.06, ease: DESLA_EASE_OUT }}
          className="font-body text-xs sm:text-sm font-normal text-[#8C6D28] mt-1.5"
        >
          {settings.body}
        </motion.p>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.11, ease: DESLA_EASE_OUT }}
          className="flex flex-wrap items-center justify-center gap-2.5 pt-3.5"
        >
          <button
            type="button"
            onClick={() => go()}
            className="px-5 h-10 rounded-full bg-[#111111] hover:bg-[#242426] text-white text-xs font-semibold flex items-center gap-1.5 active-press cursor-pointer shadow-sm"
          >
            <span className="lg:hidden">Shop now</span>
            <span className="hidden lg:inline">{settings.actionLabel}</span>
            <ArrowRight size={12} weight="bold" className="text-[#E6C77A]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onScanClick}
            className="px-4 h-10 rounded-full bg-white hover:bg-[#FAF9F6] border border-[#DDD7CC] text-[#111111] text-xs font-medium flex items-center gap-1.5 active-press cursor-pointer"
          >
            <FaceScanIcon size={13} className="text-[#8C6D28]" />
            <span>AI Skin Scan</span>
          </button>
        </motion.div>
      </div>

      {/* Mobile (< 1024px): Bespoke Embla Edge-Peeking Editorial Lookbook (replaces shrunken WebGL stamp) */}
      <div className="lg:hidden mt-5">
        <div
          ref={emblaRef}
          className="overflow-hidden"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div className="flex">
            {flexImages.map((item, idx) => {
              const isCurrent = idx === mobileIndex;
              return (
                <div
                  key={`${item.src}-${idx}`}
                  className="flex-[0_0_82vw] max-w-[340px] min-w-0 px-2"
                >
                  <button
                    type="button"
                    onClick={() => go((item.actionRoute as typeof settings.actionRoute) || settings.actionRoute, item.actionCategory)}
                    className={`group relative block w-full h-[330px] sm:h-[380px] rounded-[22px] overflow-hidden bg-[#ECE6DC] border border-[#E7E1D6] shadow-[0_18px_40px_-20px_rgba(17,17,17,0.28)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer text-left ${
                      isCurrent ? 'scale-100' : 'scale-[0.95] opacity-85'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : 'auto'}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-[#1C1712]/[0.38] backdrop-blur-md border border-white/[0.18] px-3.5 py-2.5 text-white flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#E6C77A] font-medium">
                          {item.tag}
                        </p>
                        <p className="font-heading text-xs font-medium text-white truncate mt-0.5">
                          {item.caption}
                        </p>
                      </div>
                      <span className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                        <ArrowRight size={12} weight="bold" className="text-[#E6C77A]" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimalist Hairline Indicator */}
        {flexImages.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3.5 px-4">
            <div className="flex items-center gap-1.5">
              {flexImages.map((_, idx) => {
                const active = idx === mobileIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(idx)}
                    aria-label={`View lookbook slide ${idx + 1}`}
                    aria-current={active ? 'true' : undefined}
                    className={`h-1.5 rounded-full transition-[width,background-color] duration-200 cursor-pointer ${
                      active ? 'w-6 bg-[#111111]' : 'w-1.5 bg-[#D4CEC3]'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-mono text-[#767168] ml-1 tabular-nums">
              {String(mobileIndex + 1).padStart(2, '0')} / {String(flexImages.length).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Desktop (>= 1024px): Original WebGL FlexCarousel preserved untouched */}
      {!isMobileViewport && (
        <div className="hidden lg:block w-full relative h-[390px] overflow-hidden select-none">
          <FlexCarousel
            items={flexImages}
            preset="ribbon"
            curl="twist"
            bend={0.34}
            reach={0.34}
            lensWidth={0.88}
            dispersion={0.35}
            cardHeight={0.64}
            gap={16}
            radius={14}
            fit="portrait"
            captions={false}
            autoplay={!reducedMotion && visible}
            interval={settings.intervalSeconds}
            squeeze={0.16}
            className="w-full h-full"
          />
        </div>
      )}
    </section>
  );
};

export default EditorialHero;
