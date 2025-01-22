'use client';

import React from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DashboardMain = dynamic(
  () => import('./dashboard/DashboardMain'),
  { ssr: false }
);

export default function ClientPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardMain />
    </Suspense>
  );
}