export const PARTNER_PROGRAMMES = [
  { id: 'creative', name: 'Creative Collective', role: 'PARTNER_CREATIVE', purpose: 'Content creators and UGC producers', action: 'Submit content', icon: 'clapperboard' },
  { id: 'influence', name: 'Influence Circle', role: 'PARTNER_INFLUENCE', purpose: 'Influencers and affiliate partners', action: 'Submit campaign activity', icon: 'megaphone' },
  { id: 'trade', name: 'Trade Network', role: 'PARTNER_TRADE', purpose: 'Distributors, wholesalers and stockists', action: 'Submit trade activity', icon: 'handshake' },
  { id: 'inner', name: 'Inner Circle', role: 'PARTNER_AMBASSADOR', purpose: 'Selected long-term brand ambassadors', action: 'Submit ambassador activity', icon: 'award' },
  { id: 'referral', name: 'Referral Partners', role: 'PARTNER_REFERRAL', purpose: 'Recommendations and tracked referrals', action: 'Submit referral activity', icon: 'users' },
] as const;
export type ProgrammeId = typeof PARTNER_PROGRAMMES[number]['id'];
export function programmeFor(id: string) { return PARTNER_PROGRAMMES.find(programme => programme.id === id); }
