import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
  title = 'Restricted Operations Console',
  description = 'This portal requires specific operational authorizations to view and manage formulation pipelines.'
}) => {
  const { authUser, authLoading, navigateTo, setSimulatedUserRole } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] border-t-[#D4AF37] animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#6B7280]">
          Verifying Clinical RBAC Session…
        </p>
      </div>
    );
  }

  const userRoles = authUser?.roles || [];
  const hasAccess =
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] text-[#0F0F10] font-body flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Lock className="w-7 h-7 stroke-[1.8]" />
          </div>

          <span className="text-[10px] font-mono uppercase tracking-widest text-[#997A2E] font-bold">
            Role-Based Access Control
          </span>
          <h2 className="text-2xl font-bold font-heading text-[#0F0F10] mt-1 mb-2">
            {title}
          </h2>
          <p className="text-xs text-[#6B7280] leading-relaxed mb-6">
            {description}
          </p>

          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-left text-xs mb-6">
            <div className="flex justify-between items-center text-[11px] text-[#6B7280] mb-1">
              <span>Required Roles:</span>
              <span className="font-mono font-bold text-[#0F0F10]">{allowedRoles.join(', ')}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
              <span>Your Current Role:</span>
              <span className="font-mono font-bold text-[#D4AF37]">
                {userRoles.length > 0 ? userRoles.join(', ') : 'GUEST / CUSTOMER'}
              </span>
            </div>
          </div>

          {/* Development / Preview Simulation Buttons */}
          <div className="mb-6 pt-4 border-t border-[#E5E7EB]">
            <p className="text-[11px] font-semibold text-[#6B7280] mb-2 flex items-center justify-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" /> Simulate Authorized Role:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {allowedRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSimulatedUserRole(role)}
                  className="px-3 py-1.5 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Unlock as {role}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigateTo('login')}
              className="w-full py-3 rounded-full bg-[#0F4A38] text-white text-xs font-bold shadow-md hover:bg-[#0B382A] active:scale-[0.97] transition-all cursor-pointer"
            >
              Sign In with Authorized Account
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-2.5 rounded-full bg-white/80 border border-[#E5E7EB] text-[#4B5563] text-xs font-semibold hover:text-[#0F0F10] active:scale-[0.97] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
