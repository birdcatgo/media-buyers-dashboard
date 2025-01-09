// src/components/dashboard/MonthlyMetrics.tsx

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { formatDollar } from '@/utils/formatters';

const getStatusEmoji = (profit: number) => {
  if (profit > 3000) return '🟢';
  if (profit > 1000) return '🟡';
  if (profit > 0) return '🟠';
  return '🔴';
};

const parseDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  
  // Parse DD/MM/YYYY format
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const MetricCard = ({
  title,
  value,
  icon,
  status
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  status?: string;
}) => (
  <Card>
    <CardContent className="flex items-center p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-center">
          <h3 className="text-2xl font-bold">{formatDollar(value)}</h3>
          {status && <span className="ml-2 text-2xl">{status}</span>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const TrendChart = ({ data, title }: { data: any[]; title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data}
            margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              width={80}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export const MonthlyMetrics = ({
  buyer,
  data
}: {
  buyer: string;
  data: DashboardData;
}) => {
  // Filter data by buyer/offer/network and MTD
  const filteredData = useMemo(() => {
    let filtered = [...data.tableData];

    // Filter for January 2025
    filtered = filtered.filter(row => {
      try {
        if (typeof row.date !== 'string') return false;
        
        // Parse date assuming MM/DD/YYYY format
        const [month, day, year] = row.date.split('/').map(Number);
        
        // Get the latest date in the dataset for MTD
        const latestDate = filtered.reduce((latest, r) => {
          const [m, d, y] = r.date.split('/').map(Number);
          const currentDate = new Date(y, m - 1, d);
          return currentDate > latest ? currentDate : latest;
        }, new Date(0));

        // Create date objects for comparison
        const rowDate = new Date(year, month - 1, day);
        const startDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);

        return rowDate >= startDate && rowDate <= latestDate;
      } catch (e) {
        console.error('Error parsing date:', row.date);
        return false;
      }
    });

    // Then apply buyer filter
    if (buyer !== 'all') {
      filtered = filtered.filter((row) => row.mediaBuyer === buyer);
    }

    // Add duplicate checking
    const dateCount = filtered.reduce((acc, row) => {
      acc[row.date] = (acc[row.date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Log date distribution
    console.log('MTD Date Distribution:', {
      totalRows: filtered.length,
      byDate: Object.entries(dateCount).sort().map(([date, count]) => ({
        date,
        count,
        rows: filtered.filter(row => row.date === date).map(row => ({
          mediaBuyer: row.mediaBuyer,
          offer: row.offer,
          network: row.network,
          profit: row.profit
        }))
      }))
    });

    return filtered;
  }, [data.tableData, buyer]);

  // Add debug logging
  console.log('MTD Data:', {
    totalRows: filteredData.length,
    uniqueDates: Array.from(new Set(filteredData.map(row => row.date))).sort(),
    sampleRow: filteredData[0]
  });

  // Aggregate spend/revenue/profit
  const metrics = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => ({
        spend: acc.spend + row.adSpend,
        revenue: acc.revenue + row.adRev,
        profit: acc.profit + row.profit
      }),
      { spend: 0, revenue: 0, profit: 0 }
    );
  }, [filteredData]);

  // Build dailyTrendData with proper aggregation
  const dailyTrendData = useMemo(() => {
    // Create a map to aggregate data by date
    const dailyTotals = new Map<string, {
      date: string;
      profit: number;
      spend: number;
      revenue: number;
      count: number;
    }>();

    // Process each row
    filteredData.forEach(row => {
      const date = row.date;
      const current = dailyTotals.get(date) || {
        date,
        profit: 0,
        spend: 0,
        revenue: 0,
        count: 0
      };

      current.profit += row.profit;
      current.spend += row.adSpend;
      current.revenue += row.adRev;
      current.count += 1;

      dailyTotals.set(date, current);
    });

    // Convert to array and sort by date
    const sortedData = Array.from(dailyTotals.values())
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        return new Date(aYear, aMonth - 1, aDay).getTime() - 
               new Date(bYear, bMonth - 1, bDay).getTime();
      });

    console.log('Daily Trend Data:', {
      dates: sortedData.map(d => d.date),
      totals: sortedData.map(d => ({
        date: d.date,
        profit: d.profit,
        rowCount: d.count
      }))
    });

    return sortedData;
  }, [filteredData]);

  // Offer performance array for bar chart
  const offerPerformance = useMemo(() => {
    const byOffer = filteredData.reduce((acc, row) => {
      // Normalize network and offer for Suited ACA
      const network = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA' : row.network;
      const offer = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA' : row.offer;
      // Combine network and offer for the key
      const key = `${network} - ${offer}`;
      
      if (!acc[key]) {
        acc[key] = { 
          name: key,
          profit: 0,
          spend: 0,
          revenue: 0
        };
      }
      acc[key].profit += row.profit;
      acc[key].spend += row.adSpend;
      acc[key].revenue += row.adRev;
      return acc;
    }, {} as Record<string, { name: string; profit: number; spend: number; revenue: number; }>);

    // Convert to array and sort by profit
    return Object.values(byOffer)
      .sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  // Buyer performance array for table or bar chart
  const buyerPerformance = useMemo(() => {
    const byBuyer = filteredData.reduce((acc, row) => {
      if (!acc[row.mediaBuyer]) {
        acc[row.mediaBuyer] = {
          name: row.mediaBuyer,
          profit: 0,
          spend: 0,
          revenue: 0
        };
      }
      acc[row.mediaBuyer].profit += row.profit;
      acc[row.mediaBuyer].spend += row.adSpend;
      acc[row.mediaBuyer].revenue += row.adRev;
      return acc;
    }, {} as Record<
      string,
      { name: string; profit: number; spend: number; revenue: number }
    >);

    return Object.values(byBuyer);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="MTD Spend"
          value={metrics.spend}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title="MTD Revenue"
          value={metrics.revenue}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <MetricCard
          title="MTD Profit"
          value={metrics.profit}
          icon={<PieChart className="h-6 w-6" />}
          status={getStatusEmoji(metrics.profit)}
        />
      </div>

      <div className="space-y-6">
        <TrendChart data={dailyTrendData} title="Daily Profit Trend" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryTable data={offerPerformance} title="MTD Offer Summary" />
        <SummaryTable data={buyerPerformance} title="MTD Media Buyer Performance" />
      </div>
    </div>
  );
};

const SummaryTable = ({ data, title }: { data: any[]; title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Name</th>
              <th className="text-right p-2">MTD Spend</th>
              <th className="text-right p-2">MTD Revenue</th>
              <th className="text-right p-2">MTD Profit</th>
              <th className="text-center p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{row.name}</td>
                <td className="text-right p-2">{formatDollar(row.spend)}</td>
                <td className="text-right p-2">{formatDollar(row.revenue)}</td>
                <td className="text-right p-2">{formatDollar(row.profit)}</td>
                <td className="text-center p-2">{getStatusEmoji(row.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
