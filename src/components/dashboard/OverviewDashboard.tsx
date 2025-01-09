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
  date: string | Date;
}

const parseDateString = (dateStr: string) => {
  // Input is already in MM/DD/YYYY format
  const [month, day, year] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// Update getYesterday to handle MM/DD/YYYY format
const getLatestDate = (dates: string[]) => {
  const validDates = dates
    .map(dateStr => {
      const [month, day, year] = dateStr.split('/').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    })
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return validDates[0] || new Date(Date.UTC(2025, 0, 8));
};

// Add validation logging
console.log('Date parsing validation:', {
  normalDate: parseDateString('01/02/2025')?.toISOString() ?? 'invalid',
  flippedDate: parseDateString('30/12/2024')?.toISOString() ?? 'invalid',
  anotherDate: parseDateString('13/12/2024')?.toISOString() ?? 'invalid'
});

// Helper function to check if a date is within a range
const isDateInRange = (testDate: Date | null, startDate: Date, endDate: Date) => {
  if (!testDate) return false;
  
  const normalize = (date: Date) => {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };

  const test = normalize(testDate);
  const start = normalize(startDate);
  const end = normalize(endDate);

  return test >= start && test <= end;
};

// Move calculateMetrics outside the useMemo
const calculateMetrics = (rows: any[]) => {
  if (!rows || !rows.length) return { profit: 0, spend: 0, revenue: 0, roas: 0 };
  
  const metrics = rows.reduce((acc, row) => ({
    profit: acc.profit + (row.profit || 0),
    spend: acc.spend + (row.adSpend || 0),
    revenue: acc.revenue + (row.adRev || 0)
  }), { profit: 0, spend: 0, revenue: 0 });

  const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
  return { ...metrics, roas };
};

// Add this helper function at the top
const areDatesEqual = (date1: Date | null, date2: Date | null) => {
  if (!date1 || !date2) return false;
  
  const equal = date1.getUTCFullYear() === date2.getUTCFullYear() &&
         date1.getUTCMonth() === date2.getUTCMonth() &&
         date1.getUTCDate() === date2.getUTCDate();
  
  // Log comparison details for January 8th
  if (date2.getUTCFullYear() === 2025 && 
      date2.getUTCMonth() === 0 && 
      date2.getUTCDate() === 8) {
    console.log('Jan 8 comparison:', {
      date1: {
        iso: date1.toISOString(),
        year: date1.getUTCFullYear(),
        month: date1.getUTCMonth() + 1,
        day: date1.getUTCDate()
      },
      date2: {
        iso: date2.toISOString(),
        year: date2.getUTCFullYear(),
        month: date2.getUTCMonth() + 1,
        day: date2.getUTCDate()
      },
      equal
    });
  }
  
  return equal;
};

const calculateTrend = (weekData: any[], yesterdayData: any[]) => {
  const avgDailyProfit = calculateMetrics(weekData).profit / 7;
  const yesterdayProfit = calculateMetrics(yesterdayData).profit;
  return avgDailyProfit !== 0 
    ? ((yesterdayProfit - avgDailyProfit) / Math.abs(avgDailyProfit)) * 100 
    : 100;
};

export const OverviewDashboard = ({
  data
}: {
  data: DashboardData;
}) => {
  // Add date format verification logging
  console.log('Date format check:', {
    firstFewDates: data?.tableData?.slice(0, 5).map(row => ({
      date: row.date,
      isMMDDYYYY: typeof row.date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(row.date),
      parts: typeof row.date === 'string' ? row.date.split('/') : []
    })),
    uniqueDates: Array.from(new Set(data?.tableData?.map(row => row.date))).sort()
  });

  const getYesterday = (data: DashboardData) => {
    // We know we want January 8th, 2025
    const targetDate = new Date(Date.UTC(2025, 0, 8)); // January 8th, 2025

    console.log('Target date:', {
      date: targetDate.toISOString(),
      month: targetDate.getUTCMonth() + 1, // Add 1 because months are 0-based
      day: targetDate.getUTCDate(),
      year: targetDate.getUTCFullYear()
    });

    return targetDate;
  };

  // Add debugging for incoming data with date focus
  console.log('OverviewDashboard received data:', {
    hasData: !!data?.tableData?.length,
    count: data?.tableData?.length,
    jan8Data: data?.tableData?.filter(row => row.date === '01/08/2025'),
    sampleDates: data?.tableData?.slice(0, 10).map(row => row.date)
  });

  const { buyerTrends, offerTrends } = useMemo(() => {
    const groups = new Map();
    const targetDate = '01/08/2025';
    const weekDates = [
      '01/01/2025',
      '01/02/2025',
      '01/03/2025',
      '01/04/2025',
      '01/05/2025',
      '01/06/2025',
      '01/07/2025'
    ];

    // Process data
    data.tableData.forEach(row => {
      const isTargetDate = row.date === targetDate;
      const isInWeek = weekDates.includes(row.date);

      if (isTargetDate || isInWeek) {
        const network = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA' : row.network;
        const offer = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA' : row.offer;
        const key = `${network}-${offer}-${row.mediaBuyer}`;

        const current = groups.get(key) || {
          network,
          offer,
          mediaBuyer: row.mediaBuyer,
          weekData: [],
          yesterdayData: []
        };

        if (isTargetDate) {
          current.yesterdayData.push(row);
        }
        if (isInWeek) {
          current.weekData.push(row);
        }

        groups.set(key, current);
      }
    });

    console.log('Group data:', {
      totalGroups: groups.size,
      groupKeys: Array.from(groups.keys()),
      sampleGroup: Array.from(groups.values())[0],
      weekDataSizes: Array.from(groups.values()).map(g => g.weekData.length),
      yesterdayDataSizes: Array.from(groups.values()).map(g => g.yesterdayData.length)
    });

    const allTrends = Array.from(groups.values())
      .map(group => ({
        network: group.network,
        offer: group.offer,
        mediaBuyer: group.mediaBuyer,
        avgDailyProfit: calculateMetrics(group.weekData).profit / 7,
        yesterdayProfit: calculateMetrics(group.yesterdayData).profit,
        avgDailyRoas: calculateMetrics(group.weekData).roas,
        yesterdayRoas: calculateMetrics(group.yesterdayData).roas,
        trend: calculateTrend(group.weekData, group.yesterdayData)
      }))
      .sort((a, b) => b.yesterdayProfit - a.yesterdayProfit);

    return { buyerTrends: allTrends, offerTrends: [] };
  }, [data.tableData]);

  // Add debugging for trends
  console.log('Generated trends:', {
    trendCount: buyerTrends.length,
    sample: buyerTrends.slice(0, 3)
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance Overview</h2>
      
      <div className="text-sm text-muted-foreground">
        Showing {buyerTrends.length} trends
      </div>

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