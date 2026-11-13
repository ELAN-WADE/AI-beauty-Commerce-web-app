export const programmeDefinitions = {
  CREATOR: { label: 'Creator Studio', title: 'Creative Collective', description: 'Content creation and reviewed deliverables.' },
  DISTRIBUTOR: { label: 'Distributor Hub', title: 'Trade Network', description: 'Distribution, stock and fulfilment.' },
  INFLUENCER: { label: 'Influencer / Ambassador', title: 'Influence Circle & Inner Circle', description: 'Brand promotion, ambassador activities, campaigns and reviewed deliverables.' },
} as const;
export type ProgrammeRole = keyof typeof programmeDefinitions;
export type AdditionalProgramme = 'INFLUENCER';
export const isAdditionalProgramme = (value: unknown): value is AdditionalProgramme => value === 'INFLUENCER';
export const programmePath = (_kind: AdditionalProgramme) => '/partner-programme';
