'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DashboardMain = dynamic(
  () => import('./dashboard/DashboardMain').then(mod => mod.default),
  { 
    loading: () => <div>Loading...</div>,
    ssr: false
  }
);

export default function ClientPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardMain />
    </Suspense>
  );
}