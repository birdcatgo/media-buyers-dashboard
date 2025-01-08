'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useDashboardState } from '@/hooks/useDashboardState';
import { DailyMetrics } from './DailyMetrics';
import { MonthlyMetrics } from './MonthlyMetrics';

interface DashboardWrapperProps {
  currentUser?: string;
  userRole?: 'admin' | 'media_buyer' | 'viewer';
}

const DashboardLayout = dynamic(
  () => import('./DashboardLayout'),
  { ssr: false }
);

export default function DashboardWrapper(props: DashboardWrapperProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const { data, selectedBuyer, setSelectedBuyer } = useDashboardState('all');

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-background">Loading...</div>;
  }

  return (
    <DashboardLayout 
      data={data}
      selectedBuyer={selectedBuyer}
      onBuyerChange={setSelectedBuyer}
    >
      <DailyMetrics 
        buyer={selectedBuyer}
        data={data}
      />
      <MonthlyMetrics 
        buyer={selectedBuyer}
        data={data}
      />
    </DashboardLayout>
  );
}