import React from 'react';
export function NavigationIcon({ name, size = 22, className = '' }: { name: 'home' | 'shop' | 'scan' | 'community' | 'account' | 'assistant' | 'location'; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><use href={'/icons/mobile-navigation.svg#' + name} /></svg>;
}
