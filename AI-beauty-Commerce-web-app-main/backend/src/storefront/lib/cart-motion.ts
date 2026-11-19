/** Visual feedback only: never writes cart state or reports server persistence. */
function flyToBag(from: DOMRect, image?: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]')).find(item => item.getClientRects().length && item.getBoundingClientRect().width > 0);
  if (!target) return;
  const to = target.getBoundingClientRect();
  const node = document.createElement('span');
  Object.assign(node.style, { position: 'fixed', left: `${from.left + from.width / 2 - 16}px`, top: `${from.top + from.height / 2 - 16}px`, width: '32px', height: '32px', borderRadius: '50%', background: '#FBF5E8', border: '1px solid #997A2E', zIndex: '9999', pointerEvents: 'none', overflow: 'hidden' });
  node.setAttribute('aria-hidden', 'true');
  if (image) { const img = document.createElement('img'); img.src = image; img.alt = ''; Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' }); node.appendChild(img); }
  document.body.appendChild(node);
  const dx = to.left + to.width / 2 - from.left - from.width / 2, dy = to.top + to.height / 2 - from.top - from.height / 2;
  const flight = node.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.35) rotate(12deg)`, opacity: 0.3 }], { duration: 280, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  void flight.finished.then(() => { node.remove(); if (target.isConnected) target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }); }, () => node.remove());
}

/** Wait for the owned bag to persist before showing success travel. */
export function animateToBag(source: HTMLElement, image?: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !source.animate) return;
  const from = source.getBoundingClientRect();
  const cleanup = () => { window.removeEventListener('desla:cart-saved', saved); window.removeEventListener('desla:cart-save-error', cleanup); clearTimeout(timer); };
  const saved = () => { cleanup(); flyToBag(from, image); };
  const timer = window.setTimeout(cleanup, 20000);
  window.addEventListener('desla:cart-saved', saved, { once: true });
  window.addEventListener('desla:cart-save-error', cleanup, { once: true });
}
