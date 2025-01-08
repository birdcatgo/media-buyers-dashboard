import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDollar } from '@/utils/formatters';

interface TrendData {
  network: string;
  offer: string;
  mediaBuyer: string;
  avgDailyProfit: number;
  yesterdayProfit: number;
  avgDailyRoas: number;
  yesterdayRoas: number;
  trend: number;
}

const parseDateString = (dateStr: string) => {
  const parts = dateStr.split('/').map(Number);
  
  // Input is in DD/MM/YYYY format
  const [day, month, year] = parts;
  const date = new Date(year, month - 1, day);
  
  // Add logging to verify date parsing
  console.log('Parsing date:', {
    input: dateStr,
    parts: { day, month, year },
    result: date.toISOString()
  });
  
  return date;
};

// Add validation logging
console.log('Date parsing validation:', {
  normalDate: parseDateString('01/02/2025').toISOString(), // MM/DD/YYYY
  flippedDate: parseDateString('30/12/2024').toISOString(), // DD/MM/YYYY
  anotherDate: parseDateString('13/12/2024').toISOString()  // DD/MM/YYYY (>12)
});

// Helper function to check if a date is within a range
const isDateInRange = (testDate: Date, startDate: Date, endDate: Date) => {
  const normalize = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const test = normalize(testDate);
  const start = normalize(startDate);
  const end = normalize(endDate);

  return test >= start && test <= end;
};

// Move calculateMetrics outside the useMemo
const calculateMetrics = (rows: any[]) => {
  if (!rows || !rows.length) return { profit: 0, spend: 0, revenue: 0, roas: 0 };
  
  // Sum up the metrics
  const metrics = rows.reduce((acc, row) => ({
    profit: acc.profit + (row.profit || 0),
    spend: acc.spend + (row.adSpend || 0),
    revenue: acc.revenue + (row.adRev || 0)
  }), { profit: 0, spend: 0, revenue: 0 });

  // Calculate ROAS only if there's spend
  const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;

  return { ...metrics, roas };
};

export const OverviewDashboard = ({
  data
}: {
  data: DashboardData;
}) => {
  const { buyerTrends, offerTrends } = useMemo(() => {
    // Find the most recent date in the data
    const dates = data.tableData
      .map(row => typeof row.date === 'string' ? parseDateString(row.date) : null)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    if (dates.length === 0) {
      return { buyerTrends: [], offerTrends: [] };
    }

    // Set yesterday to January 7th, 2025
    const yesterday = new Date(2025, 0, 7); // January is 0-based
    const weekStart = new Date(2025, 0, 1); // Start of January 2025

    console.log('Fixed date ranges:', {
      yesterday: yesterday.toISOString(),
      weekStart: weekStart.toISOString()
    });

    // Group data by network-offer-buyer combination
    const groups = new Map();

    data.tableData.forEach(row => {
      if (typeof row.date !== 'string') return;
      const date = parseDateString(row.date);
      const key = `${row.network}-${row.offer}-${row.mediaBuyer}`;
      
      const current = groups.get(key) || {
        network: row.network,
        offer: row.offer,
        mediaBuyer: row.mediaBuyer,
        weekData: [],
        yesterdayData: []
      };

      // Debug logging for date comparisons
      console.log('Row date check:', {
        rowDate: date.toISOString(),
        isYesterday: date.getTime() === yesterday.getTime(),
        isInWeek: isDateInRange(date, weekStart, yesterday),
        key
      });

      if (date.getTime() === yesterday.getTime()) {
        current.yesterdayData.push(row);
      }
      if (isDateInRange(date, weekStart, yesterday)) {
        current.weekData.push(row);
      }

      groups.set(key, current);
    });

    // Calculate trends
    const allTrends = Array.from(groups.values())
      .map(group => {
        // Calculate weekly metrics (including yesterday)
        const weeklyMetrics = calculateMetrics(group.weekData);
        const daysInWeek = 7;
        const avgDailyProfit = weeklyMetrics.profit / daysInWeek;
        const avgDailyRoas = weeklyMetrics.roas;

        // Calculate yesterday's metrics separately
        const yesterdayMetrics = calculateMetrics(group.yesterdayData);
        const yesterdayProfit = yesterdayMetrics.profit;
        const yesterdayRoas = yesterdayMetrics.roas;

        // Calculate trend percentage
        const trend = avgDailyProfit !== 0 
          ? ((yesterdayProfit - avgDailyProfit) / Math.abs(avgDailyProfit)) * 100 
          : 100; // If no average, but we have yesterday's profit, that's a 100% increase

        return {
          network: group.network,
          offer: group.offer,
          mediaBuyer: group.mediaBuyer,
          avgDailyProfit,
          yesterdayProfit,
          avgDailyRoas,
          yesterdayRoas,
          trend
        };
      })
      .filter(trend => trend.avgDailyProfit > 0 || trend.yesterdayProfit > 0)
      .sort((a, b) => b.yesterdayProfit - a.yesterdayProfit);

    return {
      buyerTrends: allTrends,
      offerTrends: []  // We can remove this if not needed
    };
  }, [data.tableData]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance Overview</h2>
      
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Network</TableHead>
            <TableHead className="font-semibold">Offer</TableHead>
            <TableHead className="font-semibold">Media Buyer</TableHead>
            <TableHead className="text-right font-semibold">7 Day Daily Avg</TableHead>
            <TableHead className="text-right font-semibold">Yesterday's Profit</TableHead>
            <TableHead className="text-right font-semibold">7 Day ROAS</TableHead>
            <TableHead className="text-right font-semibold">Yesterday ROAS</TableHead>
            <TableHead className="text-right font-semibold">Profit Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buyerTrends.map((trend, idx) => (
            <TableRow 
              key={idx}
              className={`
                ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                hover:bg-muted/50 transition-colors
              `}
            >
              <TableCell className="font-medium">{trend.network}</TableCell>
              <TableCell>{trend.offer}</TableCell>
              <TableCell>{trend.mediaBuyer}</TableCell>
              <TableCell className="text-right font-medium">
                {formatDollar(trend.avgDailyProfit)}
              </TableCell>
              <TableCell className={`text-right font-bold ${trend.yesterdayProfit >= trend.avgDailyProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatDollar(trend.yesterdayProfit)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {trend.avgDailyRoas.toFixed(2)}x
              </TableCell>
              <TableCell className={`text-right font-medium ${trend.yesterdayRoas >= trend.avgDailyRoas ? 'text-green-600' : 'text-red-600'}`}>
                {trend.yesterdayRoas.toFixed(2)}x
              </TableCell>
              <TableCell className="text-right">
                <span className={`flex items-center justify-end font-medium ${trend.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.trend >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(trend.trend).toFixed(1)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 