'use client';
import React, { ReactNode } from 'react';

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}