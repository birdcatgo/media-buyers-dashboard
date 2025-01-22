'use client';

import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { useDashboardState } from '@/hooks/useDashboardState';

interface DashboardLayoutProps {
  currentUser?: string;
  userRole?: 'admin' | 'media_buyer' | 'viewer';
}

export default function DashboardLayout({
  currentUser = 'Guest',
  userRole = 'viewer'
}: DashboardLayoutProps) {
  const {
    selectedBuyer,
    setSelectedBuyer,
    dateRange,
    setDateRange,
    data
  } = useDashboardState(currentUser);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onRefresh={async () => {}}
        isRefreshing={false}
      />
      <main className="container mx-auto p-4 space-y-6">
        <DashboardMetrics data={data} />
        <DashboardCharts data={data} />
      </main>
    </div>
  );
}