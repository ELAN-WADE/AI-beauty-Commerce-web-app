import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchProductReviewsApi } from '../../lib/owned-api';
import { CardSpread, type CardSpreadItem } from '../common/card-spread';

export const AuthenticReviewsSection: React.FC = () => {
  const { products, authUser, requestCustomerSignIn } = useApp();
  const [publishedReviews, setPublishedReviews] = useState<CardSpreadItem[]>([]);
  const productKey = products.slice(0, 6).map(product => product.id).join('|');
  useEffect(() => {
    setPublishedReviews([]);
    if (!authUser) return;
    let cancelled = false;
    Promise.all(products.slice(0, 6).map(product => fetchProductReviewsApi(product.id))).then(results => { if (!cancelled) setPublishedReviews(results.flatMap(rows => (rows || []).map(review => ({ ...review, city: review.city || '' }))).slice(0, 8)); });
    return () => { cancelled = true; };
  }, [productKey, authUser?.id]);
  const testimonialItems: CardSpreadItem[] = publishedReviews;
  if (!authUser) return <section className="border-b bg-[#FAF9F6] px-6 py-8 text-center"><h2 className="font-heading text-xl font-bold">Customer reviews</h2><button onClick={() => requestCustomerSignIn()} className="mt-3 text-sm font-semibold underline">Sign in to read customer reviews</button></section>;
  if (!testimonialItems.length) return <section className="border-b bg-[#FAF9F6] px-6 py-8 text-center"><h2 className="font-heading text-xl font-bold">Customer reviews</h2><p className="mt-3 text-sm text-[#6B7280]">Published customer experiences will appear here.</p></section>;

  return (
    <section
      aria-label="Customer Testimonials"
      className="py-6 sm:py-8 bg-[#FAF9F6] border-b border-[#E5E7EB] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact, Clean Section Header */}
        <div className="mb-4 sm:mb-5 text-center">
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
            In Their Own Words
          </h2>
        </div>

        {/* Card Spread Close-Packed Testimonial Deck */}
        <div className="w-full flex justify-center pb-2">
          <CardSpread
            items={testimonialItems}
            cardWidth={290}
            cardHeight={310}
            cardRadius={16}
            radius={460}
            arc={22}
            cardColor="#FFFFFF"
            cardPadding={18}
            borderColor="rgba(229, 231, 235, 0.95)"
            shadow={0.06}
            lift={18}
            push={5}
            pushReach={2}
            restOpacity={0.95}
            stiffness={160}
            damping={18}
            mass={0.9}
            interactive={true}
          />
        </div>
      </div>
    </section>
  );
};

export default AuthenticReviewsSection;
