import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DeslaWatermark } from './DeslaAuthShell';

export function CustomerAccess({ children, title = 'Sign in to continue' }: { children: React.ReactNode; title?: string }) {
  const { authUser, requestCustomerSignIn, navigateTo } = useApp();
  if (authUser?.emailVerified) return <>{children}</>;
  return (
    <div className="relative min-h-[75dvh] bg-[#FBF9F5] text-[#111111] flex items-center justify-center px-4 py-12">
      <DeslaWatermark />
      <section className="relative z-10 w-full max-w-[440px] rounded-[22px] border border-[#E7E1D6] bg-[#FBF9F5]/90 backdrop-blur-md px-6 py-8 sm:px-8 sm:py-9 text-center shadow-[0_24px_64px_-24px_rgba(17,17,17,0.11)] space-y-5">
        <div className="flex justify-center">
          <img
            src="/desla_logo_dark.svg"
            alt="Desla!"
            className="h-6 w-auto block object-contain select-none"
          />
        </div>
        <div className="space-y-1.5">
          <div className="w-6 h-[1.5px] bg-[#B89248] mx-auto mb-2.5" aria-hidden="true" />
          <h1 className="font-heading text-2xl font-semibold text-[#111111] tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-[#6E6A63] leading-relaxed">
            Use your existing Desla account or create one. The same account works across the store, rewards, and community.
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => requestCustomerSignIn()}
            className="group w-full h-11 rounded-[10px] bg-[#111111] hover:bg-[#242426] active:scale-[0.99] px-5 font-medium text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2"
          >
            <span>Sign in or create an account</span>
            <ArrowRight className="w-4 h-4 text-[#E6C77A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-xs font-medium text-[#6E6A63] hover:text-[#111111] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Continue browsing
          </button>
        </div>
      </section>
    </div>
  );
}

