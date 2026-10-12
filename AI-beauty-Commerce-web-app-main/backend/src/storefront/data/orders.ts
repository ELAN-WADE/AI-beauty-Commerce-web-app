import { Order } from '../types';

export const initialOrders: Order[] = [
  {
    id: 'AF10294',
    date: '16 Sep 2026, 14:20',
    status: 'Shipped',
    subtotal: 48500,
    deliveryFee: 2500,
    total: 51000,
    paymentMethod: 'Stripe Card (•••• 4242)',
    shippingAddress: {
      name: 'Amara Okafor',
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lagos Island',
      state: 'Lagos State',
      phone: '+234 812 345 6789'
    },
    items: [
      {
        productId: 'the-ordinary-niacinamide',
        productName: 'Niacinamide 10% + Zinc 1%',
        brand: 'THE ORDINARY',
        size: '30ml',
        price: 12000,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
      },
      {
        productId: 'la-roche-posay-anthelios',
        productName: 'Anthelios UVmune 400 Oil Control Fluid SPF50+',
        brand: 'LA ROCHE-POSAY',
        size: '50ml',
        price: 18500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'
      },
      {
        productId: 'cerave-hydrating-cleanser',
        productName: 'Hydrating Facial Cleanser',
        brand: 'CERAVE',
        size: '236ml',
        price: 14500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
      }
    ],
    trackingSteps: [
      {
        title: 'Order Confirmed',
        timestamp: '16 Sep, 14:22',
        status: 'completed',
        description: 'Payment authorized via Stripe. Order batch #GLW-9921 generated.'
      },
      {
        title: 'Processing at Hub',
        timestamp: '17 Sep, 09:15',
        status: 'completed',
        description: 'Quality verification completed at Glowly Central Fulfillment Hub, Ikeja.'
      },
      {
        title: 'In Transit',
        timestamp: '18 Sep, 08:40',
        status: 'current',
        description: 'Dispatched with GIG Logistics courier. Tracking reference: GIG-LG-829104.'
      },
      {
        title: 'Out for Delivery',
        timestamp: 'Estimated 19 Sep, 11:00',
        status: 'upcoming',
        description: 'Courier assigned to Lekki dispatch route.'
      },
      {
        title: 'Delivered',
        timestamp: 'Estimated 19 Sep, 15:00',
        status: 'upcoming',
        description: 'Package handed over with OTP verification.'
      }
    ]
  },
  {
    id: 'AF10293',
    date: '02 Aug 2026, 11:05',
    status: 'Delivered',
    subtotal: 33500,
    deliveryFee: 2000,
    total: 35500,
    paymentMethod: 'Stripe Card (•••• 4242)',
    shippingAddress: {
      name: 'Amara Okafor',
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lagos Island',
      state: 'Lagos State',
      phone: '+234 812 345 6789'
    },
    items: [
      {
        productId: 'cosrx-snail-mucin',
        productName: 'Advanced Snail 96 Mucin Power Essence',
        brand: 'COSRX',
        size: '100ml',
        price: 16500,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80'
      },
      {
        productId: 'anua-heartleaf-toner',
        productName: 'Heartleaf 77% Soothing Toner',
        brand: 'ANUA',
        size: '250ml',
        price: 17000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
      }
    ],
    trackingSteps: [
      {
        title: 'Order Confirmed',
        timestamp: '02 Aug, 11:05',
        status: 'completed',
        description: 'Payment authorized and verified.'
      },
      {
        title: 'Processing at Hub',
        timestamp: '02 Aug, 15:30',
        status: 'completed',
        description: 'Carefully packaged with temperature-safe seal.'
      },
      {
        title: 'In Transit',
        timestamp: '03 Aug, 10:12',
        status: 'completed',
        description: 'Dispatched with GIG Express.'
      },
      {
        title: 'Delivered',
        timestamp: '04 Aug, 14:25',
        status: 'completed',
        description: 'Delivered and signed by recipient in Lekki.'
      }
    ]
  }
];
