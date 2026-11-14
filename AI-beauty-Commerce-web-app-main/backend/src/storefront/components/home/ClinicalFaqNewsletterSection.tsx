import React, { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { CaretDown, Check } from '@phosphor-icons/react';
import { apiFetch } from '../../lib/owned-api';

export const ClinicalFaqNewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setBusy(true); setError('');
    try { await apiFetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email, consent: true, source: 'home', company }) }); setIsSubscribed(true); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not subscribe. Please try again.'); }
    finally { setBusy(false); }
  };

  const faqs = [
    {
      id: 'faq-nafdac',
      question: 'Are all formulations certified by NAFDAC?',
      answer:
        'Yes. Every preparation is 100% NAFDAC certified and formulated in Lagos in partnership with natural dermatologists. We strictly reject hydroquinone, mercury, steroids, and aggressive synthetic perfumes.'
    },
    {
      id: 'faq-sunscreen',
      question: 'How does Natural Defense SPF 50+ perform on deep skin tones?',
      answer:
        'Natural Defense SPF 50+ PA++++ is engineered specifically for Fitzpatrick IV–VI skin tones. It uses micro-dispersed mineral filters that absorb in under 30 seconds with zero white cast, zero purple film, and no eye stinging.'
    },
    {
      id: 'faq-delivery',
      question: 'Where are orders dispatched from and what are the delivery times?',
      answer:
        'Orders are fulfilled from our regional dispatch hubs in Lagos, Abuja, Port Harcourt, and Ibadan. Lagos deliveries qualify for same-day concierge dispatch, while regional deliveries arrive within 24 to 48 hours.'
    },
    {
      id: 'faq-privacy',
      question: 'How does the PIX™ Biometric Skin Scan protect my privacy?',
      answer:
        'The PIX™ AI skin diagnosis runs 100% on-device in your web browser using local computer vision models. No photos or camera streams are ever transmitted, stored, or viewed on remote servers.'
    }
  ];

  return (
    <section
      aria-label="Frequently Asked Questions and Journal"
      className="py-12 sm:py-16 bg-white border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Hairline Radix Accordion FAQs */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8E8E93] font-semibold">
                Natural Transparency
              </p>
              <h2 className="font-heading font-extrabold text-section-fluid text-[#0F0F10] tracking-tight">
                Frequently Inquired.
              </h2>
              <p className="text-xs text-[#6B7280] font-normal">
                Everything you need to know about our Lagos formulation standards, dispatch hubs, and biometric privacy.
              </p>
            </div>

            <Accordion.Root type="single" collapsible defaultValue="faq-nafdac" className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB] pt-0.5">
              {faqs.map((faq) => (
                <Accordion.Item
                  key={faq.id}
                  value={faq.id}
                  className="py-0.5"
                >
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex flex-1 items-center justify-between py-3.5 text-left text-xs sm:text-[13px] font-heading font-semibold text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer group focus-visible:outline-none">
                      <span>{faq.question}</span>
                      <CaretDown
                        size={14}
                        weight="bold"
                        className="text-[#8E8E93] transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#0F0F10] shrink-0 ml-3"
                        aria-hidden="true"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pb-3.5 text-xs text-[#4B5563] leading-relaxed font-normal">
                    {faq.answer}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>

          {/* Right Column: Frosted Glass Formulation Journal Invitation */}
          <div className="lg:col-span-5 pt-2 lg:pt-0">
            <div className="frosted-glass-surface rounded-2xl p-6 sm:p-7 border border-white/90 space-y-3.5 shadow-xs">
              <div className="space-y-0.5">
                <p className="text-[9.5px] font-mono uppercase tracking-wider text-[#8E8E93] font-semibold">
                  Private Subscriptions
                </p>
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F0F10]">
                  The Formulation Journal
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                  Subscribers receive priority notifications for small-batch cold-pressed releases and private dermatologist consultation sessions.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubscribe} className="space-y-2.5 pt-0.5">
                <input aria-hidden="true" tabIndex={-1} autoComplete="off" className="hidden" name="company" value={company} onChange={e => setCompany(e.target.value)} />
                <div>
                  <label htmlFor="minimal-newsletter-email" className="sr-only">
                    Email address for Formulation Journal
                  </label>
                  <input
                    id="minimal-newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2.5 rounded-full frosted-glass-pill text-[#0F0F10] placeholder-gray-400 text-xs focus:outline-none focus:border-[#0F0F10] transition-colors shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubscribed || busy}
                  className="w-full py-2.5 px-5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-heading font-semibold transition-all micro-press cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                >
                  {isSubscribed ? (
                    <>
                      <Check size={13} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
                      <span>Check your inbox to confirm</span>
                    </>
                  ) : (
                    <span>{busy ? 'Requesting…' : 'Request Invitation'}</span>
                  )}
                </button>
              </form>
              {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
              {isSubscribed && <p role="status" className="text-xs">If your address needs confirmation, an invitation will arrive shortly.</p>}

              <p className="text-[10px] text-[#9CA3AF]">
                By requesting an invitation, you agree to receive product news and the Formulation Journal by email. Confirm in your inbox. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
