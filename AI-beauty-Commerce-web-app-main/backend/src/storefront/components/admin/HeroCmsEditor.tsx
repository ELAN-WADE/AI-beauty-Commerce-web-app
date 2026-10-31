import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { uploadProductMediaApi } from '../../lib/owned-api';
import { HERO_TARGETS, moveHeroImage } from '../../lib/hero-settings';
import type { HeroSlide } from '../../types';

const input = 'w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none text-xs';
export function HeroCmsEditor() {
  const { heroSettings: settings, updateHeroSettings, heroSlides, updateHeroSlides } = useApp();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const patch = (id: string, value: Partial<HeroSlide>) => updateHeroSlides(slides => slides.map(slide => slide.id === id ? { ...slide, ...value } : slide));
  const slides = [...heroSlides].sort((a, b) => (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0));
  async function upload(files: File[]) {
    if (!files.length || busy) return;
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setNotice('Choose JPEG, PNG or WebP images.'); return; }
    if (heroSlides.length + files.length > 20) { setNotice('A hero can contain up to 20 images.'); return; }
    setBusy(true); setNotice('');
    try {
      for (const file of files) {
        const media = await uploadProductMediaApi(file);
        updateHeroSlides(current => [...current, { id: crypto.randomUUID(), image: media.url, headline: '', subtext: '', tag: '', actionLabel: '', actionRoute: 'catalogue', isActive: true, displayOrder: current.length + 1 }]);
      }
      setNotice('Images added to the draft. Publish editorial changes when ready.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Image upload failed.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] space-y-4">
      <h3 className="font-heading font-bold">Hero presentation</h3>
      <div className="flex gap-2" role="group" aria-label="Hero mode">
        {(['flex', 'slideshow'] as const).map(mode => <button type="button" key={mode} aria-pressed={settings.mode === mode} onClick={() => updateHeroSettings({ ...settings, mode })} className={'rounded-full px-5 py-2 text-xs border ' + (settings.mode === mode ? 'bg-[#0F0F10] text-[#D4AF37]' : 'border-[#EAE8E3]')}>{mode === 'flex' ? 'Flex carousel' : 'Full-width slideshow'}</button>)}
      </div>
      <p className="text-xs text-[#71717A]">{settings.mode === 'flex' ? 'One short heading and body above the carousel. Images have no lower captions.' : 'Each slide fills the hero and uses its own text and CTA, or the defaults below.'}</p>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="text-xs">Heading<input className={input} maxLength={48} value={settings.heading} onChange={e => updateHeroSettings({ ...settings, heading: e.target.value })} /></label>
        <label className="text-xs">Body<input className={input} maxLength={100} value={settings.body} onChange={e => updateHeroSettings({ ...settings, body: e.target.value })} /></label>
        <label className="text-xs">CTA label<input className={input} maxLength={40} value={settings.actionLabel} onChange={e => updateHeroSettings({ ...settings, actionLabel: e.target.value })} /></label>
        <label className="text-xs">CTA destination<select className={input} value={settings.actionRoute} onChange={e => updateHeroSettings({ ...settings, actionRoute: e.target.value as typeof settings.actionRoute })}>{HERO_TARGETS.map(route => <option key={route} value={route}>{route}</option>)}</select></label>
        <label className="text-xs">Seconds per slide<input className={input} type="number" min={3} max={15} value={settings.intervalSeconds} onChange={e => updateHeroSettings({ ...settings, intervalSeconds: Number(e.target.value) })} /></label>
      </div>
      <label className="inline-block rounded-full bg-[#0F0F10] text-[#D4AF37] px-5 py-3 text-xs cursor-pointer">
        {busy ? 'Uploading imagesâ€¦' : 'Upload hero images'}
        <input aria-label="Upload hero images" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => { void upload(Array.from(e.target.files || [])); e.target.value = ''; }} />
      </label>
      {notice && <p role="status" className="text-xs">{notice}</p>}
    </div>
    {!slides.length && <p className="text-sm text-[#71717A]">Upload images to create your first hero.</p>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {slides.map((slide, index) => <div key={slide.id} className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-3">
        <img src={slide.image || undefined} alt={slide.headline || 'Hero image ' + (index + 1)} className="aspect-video w-full object-cover rounded-2xl" />
        <label className="flex gap-2 items-center text-xs"><input type="checkbox" checked={slide.isActive} onChange={e => patch(slide.id, { isActive: e.target.checked })} />Include image {index + 1}</label>
        {settings.mode === 'slideshow' && <>
          <label className="block text-xs">Slide heading<input className={input} maxLength={48} placeholder={settings.heading} value={slide.headline} onChange={e => patch(slide.id, { headline: e.target.value })} /></label>
          <label className="block text-xs">Slide body<input className={input} maxLength={100} placeholder={settings.body} value={slide.subtext} onChange={e => patch(slide.id, { subtext: e.target.value })} /></label>
          <label className="block text-xs">CTA label<input className={input} maxLength={40} placeholder={settings.actionLabel} value={slide.actionLabel} onChange={e => patch(slide.id, { actionLabel: e.target.value })} /></label>
          <label className="block text-xs">CTA destination<select className={input} value={slide.actionRoute || settings.actionRoute} onChange={e => patch(slide.id, { actionRoute: e.target.value })}>{HERO_TARGETS.map(route => <option key={route} value={route}>{route}</option>)}</select></label>
        </>}
        <div className="flex gap-3 text-xs">
          <button type="button" disabled={index === 0} onClick={() => updateHeroSlides(current => moveHeroImage(current, slide.id, -1))}>Move earlier</button>
          <button type="button" disabled={index === slides.length - 1} onClick={() => updateHeroSlides(current => moveHeroImage(current, slide.id, 1))}>Move later</button>
          <button type="button" className="text-red-700" onClick={() => updateHeroSlides(current => current.filter(item => item.id !== slide.id))}>Remove</button>
        </div>
      </div>)}
    </div>
  </div>;
}
