import { AccessIllustration } from './AccessIllustration';
import React from 'react';
import { useApp } from '../../context/AppContext';

export function CustomerAccess({ children, title = 'Sign in to continue' }: { children: React.ReactNode; title?: string }) {
  const { authUser, authLoading, requestCustomerSignIn, navigateTo } = useApp();
  if (authLoading && !authUser) return <div role="status" className="min-h-[50vh] flex items-center justify-center text-sm">Checking your session…</div>;
  if (authUser?.emailVerified) return <>{children}</>;
  return <section className="mx-auto max-w-md px-6 py-16 text-center space-y-5">
    <AccessIllustration community={/community/i.test(title)} />
    <h1 className="font-heading text-2xl font-bold">{title}</h1>
    <p className="text-sm text-[#6B7280]">Use your existing Desla account or create one. The same account works across the store and community.</p>
    <button onClick={() => requestCustomerSignIn()} className="w-full rounded-xl bg-[#0F0F10] px-5 py-3 font-semibold text-white">Sign in or create an account</button>
    <button onClick={() => navigateTo('home')} className="text-sm underline">Continue browsing</button>
  </section>;
}

