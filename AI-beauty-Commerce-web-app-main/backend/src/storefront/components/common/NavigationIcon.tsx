'use client';

import React from 'react';
import {
  House,
  Storefront,
  Scan,
  UsersThree,
  UserCircle,
  MapPin,
} from '@phosphor-icons/react';

export type NavIconName =
  | 'home'
  | 'shop'
  | 'scan'
  | 'community'
  | 'account'
  | 'assistant'
  | 'location';

export function NavigationIcon({
  name,
  size = 20,
  className = '',
  active = true,
}: {
  name: NavIconName;
  size?: number;
  className?: string;
  active?: boolean;
}) {
  const weight = active ? 'fill' : 'regular';
  switch (name) {
    case 'home':
      return <House size={size} weight={weight} className={className} aria-hidden="true" />;
    case 'shop':
      return <Storefront size={size} weight={weight} className={className} aria-hidden="true" />;
    case 'scan':
      return <Scan size={size} weight={active ? 'fill' : 'duotone'} className={className} aria-hidden="true" />;
    case 'community':
      return <UsersThree size={size} weight={weight} className={className} aria-hidden="true" />;
    case 'account':
      return <UserCircle size={size} weight={weight} className={className} aria-hidden="true" />;
    case 'assistant':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><use href="/icons/mobile-navigation.svg#assistant" /></svg>;
    case 'location':
      return <MapPin size={size} weight={weight} className={className} aria-hidden="true" />;
    default:
      return null;
  }
}
