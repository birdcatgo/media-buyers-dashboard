// src/components/dashboard/MonthlyMetrics.tsx

import React, { useMemo, useState } from 'react';
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
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { formatDollar } from '@/utils/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROIWidget } from './ROIWidget';
import { getSimplifiedTrend } from '@/utils/trendIndicators';

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

type MetricType = 'profit' | 'roi';

const TrendChart = ({ data, title }: { data: any[]; title: string }) => {
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [metricType, setMetricType] = useState<MetricType>('profit');

  // Get unique offers from data
  const uniqueOffers = useMemo(() => {
    const offers = new Set<string>();
    data.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date') offers.add(key);
      });
    });
    return Array.from(offers).sort();
  }, [data]);

  // Calculate chart data with cumulative totals as default
  const chartData = useMemo(() => {
    return data.map(day => {
      const dayData: any = { date: day.date };
      
      if (selectedOffers.length === 0) {
        // Calculate daily totals for all offers
        let totalProfit = 0;
        let totalSpend = 0;
        
        uniqueOffers.forEach(offer => {
          if (day[offer]) {
            totalProfit += day[offer].profit || 0;
            totalSpend += day[offer].spend || 0;
          }
        });

        dayData.Total = metricType === 'profit' 
          ? totalProfit 
          : (totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0);
      } else {
        // Show selected individual offers
        selectedOffers.forEach(offer => {
          if (metricType === 'profit') {
            dayData[offer] = day[offer]?.profit || 0;
          } else {
            const spend = day[offer]?.spend || 0;
            const profit = day[offer]?.profit || 0;
            dayData[offer] = spend > 0 ? (profit / spend) * 100 : 0;
          }
        });
      }
      
      return dayData;
    });
  }, [data, selectedOffers, metricType, uniqueOffers]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-4">
            <Select
              value={metricType}
              onValueChange={(value: MetricType) => setMetricType(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="roi">ROI</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedOffers.join(',') || 'all'}
              onValueChange={(value) => setSelectedOffers(value === 'all' ? [] : value.split(','))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select offers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Daily Total</SelectItem>
                {uniqueOffers.map(offer => (
                  <SelectItem key={offer} value={offer}>
                    {offer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
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
                tickFormatter={(value) => 
                  metricType === 'profit' 
                    ? `$${value.toLocaleString()}`
                    : `${value.toFixed(1)}%`
                }
                width={80}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  metricType === 'profit'
                    ? `$${value.toLocaleString()}`
                    : `${value.toFixed(1)}%`,
                  name
                ]}
              />
              <Legend />
              {selectedOffers.length === 0 ? (
                <Line 
                  type="monotone" 
                  dataKey="Total"
                  name="Daily Total"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot
                />
              ) : (
                selectedOffers.map((offer, index) => (
                  <Line 
                    key={offer}
                    type="monotone" 
                    dataKey={offer}
                    stroke={`hsl(${(index * 360) / selectedOffers.length}, 70%, 50%)`}
                    strokeWidth={2}
                    dot
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

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
    // Create a map to aggregate data by date and offer
    const dailyTotals = new Map<string, {
      date: string;
      [key: string]: any; // For offer-specific data
    }>();

    // Process each row
    filteredData.forEach(row => {
      const date = row.date;
      const offerKey = (row.network === 'Suited' && row.offer === 'ACA') 
        ? 'ACA - ACA' 
        : `${row.network} - ${row.offer}`;

      if (!dailyTotals.has(date)) {
        dailyTotals.set(date, { date });
      }
      
      const dayData = dailyTotals.get(date)!;
      if (!dayData[offerKey]) {
        dayData[offerKey] = {
          profit: 0,
          spend: 0,
          revenue: 0
        };
      }

      dayData[offerKey].profit += row.profit;
      dayData[offerKey].spend += row.adSpend;
      dayData[offerKey].revenue += row.adRev;
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
        sampleDay: sortedData[0],
        offers: Object.keys(sortedData[0] || {}).filter(key => key !== 'date')
      });

    return sortedData;
  }, [filteredData]);

  // Offer performance array for bar chart
  const offerPerformance = useMemo(() => {
    const byOffer = filteredData.reduce((acc, row) => {
      const network = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA' : row.network;
      const offer = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA' : row.offer;
      const key = `${network} - ${offer}`;
      
      if (!acc[key]) {
        acc[key] = { 
          name: key,
          profit: 0,
          spend: 0,
          revenue: 0,
          previousPeriodProfit: 0
        };
      }
      acc[key].profit += row.profit;
      acc[key].spend += row.adSpend;
      acc[key].revenue += row.adRev;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(byOffer).sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  // Buyer performance array for table or bar chart
  const buyerPerformance = useMemo(() => {
    const byBuyer = filteredData.reduce((acc, row) => {
      if (!acc[row.mediaBuyer]) {
        acc[row.mediaBuyer] = {
          name: row.mediaBuyer,
          profit: 0,
          spend: 0,
          revenue: 0,
          previousPeriodProfit: 0
        };
      }
      acc[row.mediaBuyer].profit += row.profit;
      acc[row.mediaBuyer].spend += row.adSpend;
      acc[row.mediaBuyer].revenue += row.adRev;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(byBuyer);
  }, [filteredData]);

  const roi = metrics.spend > 0 ? (metrics.profit / metrics.spend) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
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
        />
        <ROIWidget roi={roi} />
      </div>

      <div>
        <TrendChart data={dailyTrendData} title="Daily Profit Trend" />
      </div>

      <div className="space-y-6">
        <SummaryTable data={offerPerformance} title="MTD Offer Summary" />
        <SummaryTable data={buyerPerformance} title="MTD Media Buyer Performance" />
      </div>
    </div>
  );
};

const SummaryTable = ({ data, title }: { data: any[]; title: string }) => {
  // Add previous period comparison
  const dataWithTrends = data.map(row => ({
    ...row,
    trend: getSimplifiedTrend(row.profit, row.previousPeriodProfit || 0)
  }));

  return (
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
                <th className="text-right p-2">ROI</th>
                <th className="text-center p-2">Status</th>
                <th className="text-center p-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {dataWithTrends.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{row.name}</td>
                  <td className="text-right p-2">{formatDollar(row.spend)}</td>
                  <td className="text-right p-2">{formatDollar(row.revenue)}</td>
                  <td className="text-right p-2">{formatDollar(row.profit)}</td>
                  <td className="text-right p-2">
                    {row.spend > 0 ? `${((row.profit / row.spend) * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="text-center p-2">{getStatusEmoji(row.profit)}</td>
                  <td className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                      <span className={
                        row.trend.type === 'positive' ? 'text-green-500' :
                        row.trend.type === 'negative' ? 'text-red-500' :
                        'text-gray-500'
                      }>
                        {row.trend.icon}
                      </span>
                      <span className="text-xs text-gray-500">
                        {row.trend.label}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
