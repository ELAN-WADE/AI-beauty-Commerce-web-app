import React, { useId } from 'react';
export function AccessIllustration({ community = false }: { community?: boolean }) {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 240 180" role="img" aria-label={community ? 'Community members' : 'Your personal account'} className="mx-auto mb-6 h-40 w-56" fill="none">
    <defs><linearGradient id={id + 'body'} x1="75" y1="65" x2="160" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#F0E2BD"/><stop offset=".6" stopColor="#C1A56B"/><stop offset="1" stopColor="#8A7042"/></linearGradient><radialGradient id={id + 'head'} cx="0" cy="0" r="1" gradientTransform="translate(109 56) rotate(55) scale(51)"><stop stopColor="#FFF7E5"/><stop offset="1" stopColor="#C4A877"/></radialGradient></defs>
    <ellipse cx="120" cy="158" rx="90" ry="12" fill="#0F0F10" opacity=".06"/>
    {community && <g opacity=".8"><circle cx="55" cy="83" r="19" fill="#D6DBD4"/><path d="M23 142c0-29 13-39 32-39s32 10 32 39" fill="#A7B3A5"/><circle cx="185" cy="83" r="19" fill="#DBD5C9"/><path d="M153 142c0-29 13-39 32-39s32 10 32 39" fill="#B8AD97"/></g>}
    <path d="M72 153c0-38 17-56 48-56s48 18 48 56c-22 12-74 12-96 0Z" fill={'url(#' + id + 'body)'}/>
    <circle cx="120" cy="65" r="31" fill={'url(#' + id + 'head)'}/>
    <path d="M87 126c5-12 13-17 23-19" stroke="white" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}
