'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { DollarSign, TrendingUp, PieChart, BarChart2 } from 'lucide-react';
import { DashboardData } from '../../types/dashboard';
import { normalizeNetworkOffer } from '@/utils/dataUtils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  prefix?: string;
  suffix?: string;
}

const MetricCard = ({ title, value, icon, trend, prefix = '', suffix = '' }: MetricCardProps) => (
  <Card>
    <CardContent className="flex flex-row items-center p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-center">
          <h3 className="text-2xl font-bold">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </h3>
          {trend !== undefined && (
            <span className={`ml-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardMetricsProps {
  data: DashboardData;
}

export const DashboardMetrics = ({ data }: DashboardMetricsProps) => {
  // Calculate total metrics from the normalized daily data
  const normalizedData = data.dailyData.map(normalizeNetworkOffer);
  const totalAdSpend = normalizedData.reduce((sum, day) => sum + day.adSpend, 0);
  const totalRevenue = normalizedData.reduce((sum, day) => sum + day.revenue, 0);
  const totalProfit = normalizedData.reduce((sum, day) => sum + day.profit, 0);
  const roi = totalAdSpend > 0 ? ((totalProfit / totalAdSpend) * 100).toFixed(1) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Ad Spend"
        value={totalAdSpend}
        icon={<DollarSign className="h-6 w-6 text-primary" />}
        prefix="$"
      />
      <MetricCard
        title="Revenue"
        value={totalRevenue}
        icon={<TrendingUp className="h-6 w-6 text-primary" />}
        prefix="$"
      />
      <MetricCard
        title="Profit"
        value={totalProfit}
        icon={<PieChart className="h-6 w-6 text-primary" />}
        prefix="$"
      />
      <MetricCard
        title="ROI"
        value={roi}
        icon={<BarChart2 className="h-6 w-6 text-primary" />}
        suffix="%"
      />
    </div>
  );
};