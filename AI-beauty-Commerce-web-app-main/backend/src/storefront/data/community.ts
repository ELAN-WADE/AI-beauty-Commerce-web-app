import { CommunityMessage } from '../types';

export const communityChannels = [
  { id: 'all', name: 'All Topics', icon: 'Sparkles' },
  { id: 'skincare-journey', name: 'Skincare Journey', icon: 'Smile' },
  { id: 'acne-blemishes', name: 'Acne & Pores', icon: 'Droplets' },
  { id: 'ask-the-chemist', name: 'Ask The Chemist', icon: 'Shield' }
];

export const initialCommunityMessages: CommunityMessage[] = [
  {
    id: 'msg-1',
    sender: 'Dr. Kemi Balogun',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    role: 'chemist',
    roleBadge: 'Verified Chemist',
    channel: 'ask-the-chemist',
    text: 'Weekly active formulation tip: Always apply water-based humectants (like Hyaluronic Acid & Snail Mucin) onto damp skin before locking them in with a ceramide cream. This prevents trans-epidermal moisture evaporation in dry or air-conditioned environments.',
    timestamp: '10:15 AM',
    likesCount: 38,
    likedByMe: true,
    taggedProduct: {
      id: 'cosrx-snail-mucin',
      name: 'Advanced Snail 96 Mucin Power Essence',
      brand: 'COSRX',
      image: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=400&q=80',
      price: 16500
    }
  },
  {
    id: 'msg-2',
    sender: 'Grace Johnson',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'member',
    skinType: 'Oily & Acne-Prone',
    channel: 'acne-blemishes',
    text: '3-week update with The Ordinary Niacinamide 10% + Zinc! The stubborn congestion on my forehead is almost completely gone and midday shine on my nose has reduced noticeably. Anyone else pairing this with BHA at night?',
    timestamp: '11:42 AM',
    likesCount: 24,
    likedByMe: false,
    taggedProduct: {
      id: 'the-ordinary-niacinamide',
      name: 'Niacinamide 10% + Zinc 1%',
      brand: 'THE ORDINARY',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
      price: 12000
    }
  },
  {
    id: 'msg-3',
    sender: 'Zainab Adeleke',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    role: 'member',
    skinType: 'Combination / Sensitive',
    channel: 'skincare-journey',
    text: 'Finally found an SPF that leaves ZERO white cast on dark skin! La Roche-Posay Anthelios 400 is worth every kobo. It sets completely matte without stinging my eyes.',
    timestamp: '1:20 PM',
    likesCount: 19,
    likedByMe: true,
    taggedProduct: {
      id: 'la-roche-posay-anthelios',
      name: 'Anthelios UVmune 400 Oil Control Fluid SPF50+',
      brand: 'LA ROCHE-POSAY',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80',
      price: 18500
    }
  },
  {
    id: 'msg-4',
    sender: 'Glowly Skincare Desk',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    roleBadge: 'Glowly Admin',
    channel: 'ask-the-chemist',
    text: 'Reminder: Direct batch verification codes are stamped on every box dispatched from our Lagos and Abuja hubs. Check your batch authenticity guarantee directly in your Orders screen.',
    timestamp: '2:05 PM',
    likesCount: 42,
    likedByMe: false
  }
];
