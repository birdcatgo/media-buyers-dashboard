'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRange } from '@/hooks/useDashboardState';

interface DashboardHeaderProps {
  currentUser?: string;
  userRole?: 'admin' | 'media_buyer' | 'viewer';
  selectedBuyer?: string;
  onBuyerChange?: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (value: DateRange) => void;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export const DashboardHeader = ({ onRefresh, isRefreshing = false }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-gradient-to-r from-[#450a0a] to-[#991b1b] text-white">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
          </svg>
          <h1 className="text-2xl font-bold">Convert 2 Freedom - Media Buyer Dashboard</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-white text-[#450a0a] hover:bg-white/90 hover:text-[#450a0a] border-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
    </header>
  );
};