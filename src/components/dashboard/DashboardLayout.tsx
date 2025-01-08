'use client';

import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardData } from '@/types/dashboard';

export default function DashboardLayout({
  data,
  selectedBuyer,
  onBuyerChange,
  children
}: {
  data: DashboardData;
  selectedBuyer: string;
  onBuyerChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const buyers = ['all', ...Array.from(new Set(data.tableData.map(row => row.mediaBuyer)))].sort();

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex gap-4">
          <Select value={selectedBuyer} onValueChange={onBuyerChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select buyer" />
            </SelectTrigger>
            <SelectContent>
              {buyers.map(buyer => (
                <SelectItem key={buyer} value={buyer}>
                  {buyer === 'all' ? 'All Buyers' : buyer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {children}
    </div>
  );
}