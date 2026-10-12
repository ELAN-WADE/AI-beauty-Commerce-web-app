import React from 'react';

/** Partner workspaces (creator/distributor) — own shell, no storefront chrome. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F0F10] relative font-body flex flex-col overflow-x-clip">
      <main className="flex-1 w-full relative">{children}</main>
    </div>
  );
}
