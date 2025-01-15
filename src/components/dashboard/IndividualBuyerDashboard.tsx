import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { RawData } from './RawData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDollar } from '@/utils/formatters';
import { normalizeNetworkOffer } from '@/utils/dataUtils';
import { ROIWidget } from './ROIWidget';
import { getROIStatus, getTrendIcon, getTrendColor } from '@/utils/statusIndicators';

type TimeRange = 'yesterday' | '7d' | '14d' | 'mtd' | '30d' | '60d' | 'lastMonth' | 'ytd';

interface PerformanceData {
  name: string;
  profit: number;
  spend: number;
  revenue: number;
}

interface Props {
  buyer: string;
  data: DashboardData;
  offer?: string;
  network?: string;
}

const getTimeRangeLabel = (timeRange: TimeRange): string => {
  switch (timeRange) {
    case 'yesterday':
      return "Yesterday's";
    case '7d':
      return 'Last 7 Days';
    case '14d':
      return 'Last 14 Days';
    case 'mtd':
      return 'MTD';
    case '30d':
      return 'Last 30 Days';
    case '60d':
      return 'Last 60 Days';
    case 'lastMonth':
      return 'Last Month';
    case 'ytd':
      return 'YTD';
    default:
      return '';
  }
};

const MetricCard = ({ title, value, icon }: { 
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="flex items-center p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">${value.toLocaleString()}</h3>
      </div>
    </CardContent>
  </Card>
);

const SummaryTable = ({ data, title, timeRange }: { 
  data: any[]; 
  title: string;
  timeRange: TimeRange;
}) => (
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
              <th className="text-right p-2">{getTimeRangeLabel(timeRange)} Spend</th>
              <th className="text-right p-2">{getTimeRangeLabel(timeRange)} Revenue</th>
              <th className="text-right p-2">{getTimeRangeLabel(timeRange)} Profit</th>
              <th className="text-right p-2">ROI</th>
              <th className="text-center p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const roi = row.spend > 0 ? (row.profit / row.spend) * 100 : 0;
              const status = getROIStatus(roi, row.spend);
              
              const trend = row.previousPeriodProfit 
                ? ((row.profit - row.previousPeriodProfit) / Math.abs(row.previousPeriodProfit)) * 100
                : 0;

              return (
                <tr key={idx} className="border-b">
                  <td className="p-2">{row.name}</td>
                  <td className="text-right p-2">{formatDollar(row.spend)}</td>
                  <td className="text-right p-2">{formatDollar(row.revenue)}</td>
                  <td className="text-right p-2">{formatDollar(row.profit)}</td>
                  <td className="text-right p-2">
                    {row.spend > 0 ? `${roi.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="text-center p-2">
                    <span title={status.label}>{status.icon}</span>
                  </td>
                  <td className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                      <span className={getTrendColor(trend)}>
                        {getTrendIcon(trend)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {trend !== 0 ? `${Math.abs(trend).toFixed(1)}%` : 'NC'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

const DailyProfitChart = ({ data, timeRange }: { 
  data: any[]; 
  timeRange: TimeRange;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Daily Profit</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={(value) => formatDollar(value)}
              width={100}
            />
            <Tooltip 
              formatter={(value: number) => [formatDollar(value), 'Profit']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#22c55e" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

interface PerformanceItem {
  profit: number;
  spend: number;
  revenue: number;
  name: string;
}

// Add this helper function to find the latest date
const getLatestDate = (data: any[]): Date => {
  const dates = data
    .map(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      return new Date(year, month - 1, day);
    })
    .filter(date => !isNaN(date.getTime()));
  
  return new Date(Math.max(...dates.map(d => d.getTime())));
};

// Add this helper function after getLatestDate
const getDateRange = (timeRange: TimeRange, latestDate: Date): { start: Date, end: Date } => {
  let end = latestDate;
  let start: Date;

  switch (timeRange) {
    case 'yesterday':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 1);
      return { start, end: start }; // For yesterday, end is same as start
    case '7d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 6);
      return { start, end };
    case '14d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 13);
      return { start, end };
    case 'mtd':
      start = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      return { start, end };
    case '30d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 29);
      return { start, end };
    case '60d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 59);
      return { start, end };
    case 'lastMonth':
      // For last month, we want the full previous month
      start = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
      end = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
      return { start, end };
    case 'ytd':
      start = new Date(latestDate.getFullYear(), 0, 1);
      return { start, end };
    default:
      return { start: end, end };
  }
};

export const BuyerDashboard = ({ 
  buyer, 
  data,
  offer = 'all',
  network = 'all' 
}: Props) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('mtd');
  const [customDate, setCustomDate] = useState(new Date('2025-01-06'));

  const filteredData = useMemo(() => {
    return data.tableData.filter(row => {
      if (typeof row.date !== 'string') return false;
      
      // Parse MM/DD/YYYY format
      const [month, day, year] = row.date.split('/').map(Number);

      // Add debug logging
      console.log('Filtering row:', {
        date: row.date,
        parsed: { month, day, year },
        mediaBuyer: row.mediaBuyer,
        isMatch: month === 1 && year === 2025 && row.mediaBuyer === buyer
      });

      return month === 1 && year === 2025 && row.mediaBuyer === buyer;
    });
  }, [data.tableData, buyer]);

  const metrics = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    
    const mtdData = filteredData.filter(row => {
      if (typeof row.date !== 'string') return false;
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      const { start, end } = getDateRange(timeRange, latestDate);
      return rowDate >= start && rowDate <= end;
    });

    // Log filtered data
    console.log('Metrics data:', {
      timeRange,
      totalRows: mtdData.length,
      uniqueDates: Array.from(new Set(mtdData.map(row => row.date))).sort()
    });

    return mtdData.reduce(
      (acc, row) => ({
        spend: acc.spend + row.adSpend,
        revenue: acc.revenue + row.adRev,
        profit: acc.profit + row.profit
      }),
      { spend: 0, revenue: 0, profit: 0 }
    );
  }, [filteredData, timeRange, data.tableData]);

  const { offerPerformance, accountPerformance } = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    
    const timeRangeData = data.tableData.filter(row => {
      if (typeof row.date !== 'string') return false;
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      const { start, end } = getDateRange(timeRange, latestDate);
      return rowDate >= start && rowDate <= end;
    }).filter(row => row.mediaBuyer === buyer);

    // Calculate offer performance
    const byOffer = timeRangeData.reduce((acc, row) => {
      const key = `${row.network} - ${row.offer}`;
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

    // Calculate account performance
    const byAccount = timeRangeData.reduce((acc, row) => {
      if (!acc[row.adAccount]) {
        acc[row.adAccount] = { 
          name: row.adAccount, 
          profit: 0, 
          spend: 0, 
          revenue: 0 
        };
      }
      acc[row.adAccount].profit += row.profit;
      acc[row.adAccount].spend += row.adSpend;
      acc[row.adAccount].revenue += row.adRev;
      return acc;
    }, {} as Record<string, { name: string; profit: number; spend: number; revenue: number; }>);

    // Add debug logging
    console.log('Performance calculations:', {
      timeRange,
      totalRows: timeRangeData.length,
      uniqueDates: Array.from(new Set(timeRangeData.map(row => row.date))).sort(),
      offerCount: Object.keys(byOffer).length,
      accountCount: Object.keys(byAccount).length
    });

    return {
      offerPerformance: Object.values(byOffer).sort((a, b) => b.profit - a.profit),
      accountPerformance: Object.values(byAccount).sort((a, b) => b.profit - a.profit)
    };
  }, [data.tableData, buyer, timeRange]);

  const dailyProfitData = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    const dailyProfits = new Map();

    // Process each row
    filteredData.forEach(row => {
      try {
        const [month, day, year] = row.date.split('/').map(Number);
        const formattedDate = row.date;
        
        const currentProfit = dailyProfits.get(formattedDate)?.profit || 0;
        dailyProfits.set(formattedDate, {
          date: formattedDate,
          profit: currentProfit + Number(row.profit)
        });
      } catch (e) {
        console.error('Error processing row:', row, e);
      }
    });

    // Fill in missing dates based on selected time range
    const { start: startDate, end: endDate } = getDateRange(timeRange, latestDate);

    // Fill in any missing dates in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const formattedDate = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
      if (!dailyProfits.has(formattedDate)) {
        dailyProfits.set(formattedDate, {
          date: formattedDate,
          profit: 0
        });
      }
    }

    // Log daily profits
    console.log('Daily Profits:', {
      dates: Array.from(dailyProfits.keys()).sort(),
      sampleValues: Array.from(dailyProfits.values()).slice(0, 3)
    });

    return Array.from(dailyProfits.values())
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        const dateA = new Date(aYear, aMonth - 1, aDay);
        const dateB = new Date(bYear, bMonth - 1, bDay);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredData, timeRange, data.tableData]);

  const roi = metrics.spend > 0 ? (metrics.profit / metrics.spend) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{buyer}'s Dashboard</h2>
        <div className="flex justify-end mb-4">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="60d">Last 60 Days</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title={`${getTimeRangeLabel(timeRange)} Spend`}
          value={metrics.spend}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title={`${getTimeRangeLabel(timeRange)} Revenue`}
          value={metrics.revenue}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <MetricCard
          title={`${getTimeRangeLabel(timeRange)} Profit`}
          value={metrics.profit}
          icon={<PieChart className="h-6 w-6" />}
        />
        <ROIWidget roi={roi} />
      </div>

      <DailyProfitChart 
        data={dailyProfitData} 
        timeRange={timeRange}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryTable 
          data={offerPerformance} 
          title={`${getTimeRangeLabel(timeRange)} Offer Summary`} 
          timeRange={timeRange}
        />
        <SummaryTable 
          data={accountPerformance} 
          title={`${getTimeRangeLabel(timeRange)} Account Summary`} 
          timeRange={timeRange}
        />
      </div>

      <div className="mt-8">
        <RawData 
          buyer={buyer}
          data={{
            ...data,
            // Pre-filter the tableData for this buyer
            tableData: data.tableData.filter(row => row.mediaBuyer === buyer)
          }}
          offer={offer}
          network={network}
        />
      </div>
    </div>
  );
};