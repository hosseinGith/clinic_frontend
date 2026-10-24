import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DemoBanner } from './DemoBanner';
import { SubscriptionBanner } from './SubscriptionBanner';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#171717] flex">
      {/* Sidebar (Desktop fixed right + Mobile drawer) */}
      <Sidebar
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-64 transition-all duration-200">
        <DemoBanner />
        <SubscriptionBanner />
        <TopBar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
