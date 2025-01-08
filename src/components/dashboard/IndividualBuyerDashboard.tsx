import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { RawData } from './RawData';
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDollar } from '@/utils/formatters';

type TimeRange = 'eod' | 'mtd' | '7d' | '60d' | '90d';

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

const SummaryTable = ({ data, title }: { data: any[], title: string }) => (
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
                <td className="text-right p-2">${row.spend.toLocaleString()}</td>
                <td className="text-right p-2">${row.revenue.toLocaleString()}</td>
                <td className="text-right p-2">${row.profit.toLocaleString()}</td>
                <td className="text-center p-2">
                  {row.profit > 3000 ? '🟢' : row.profit > 1000 ? '🟡' : row.profit > 0 ? '🟠' : '🔴'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

const DailyProfitChart = ({ data, timeRange, setTimeRange }: { 
  data: any[]; 
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
}) => {
  const filteredData = useMemo(() => {
    // Parse DD/MM/YYYY string to Date
    const parseDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    // Get reference dates
    const endDate = new Date(2025, 0, 7);  // January 7th, 2025
    let startDate = new Date(2025, 0, 1);  // January 1st, 2025

    // Calculate start date based on timeRange
    switch (timeRange) {
      case 'mtd':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case '7d':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '60d':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 60);
        break;
      case '90d':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    return data.filter(item => {
      if (!item.date) return false;
      const itemDate = parseDate(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, timeRange]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daily Profit</CardTitle>
        <select 
          className="border rounded p-1"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
        >
          <option value="mtd">Month to Date</option>
          <option value="7d">Last 7 Days</option>
          <option value="60d">Last 60 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredData}
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
};

const DateRangeSelector = ({ timeRange, setTimeRange }: { 
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
}) => (
  <div className="flex items-center gap-4">
    <select 
      className="border rounded p-1"
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
    >
      <option value="mtd">Month to Date</option>
      <option value="7d">Last 7 Days</option>
      <option value="60d">Last 60 Days</option>
      <option value="90d">Last 90 Days</option>
    </select>
  </div>
);

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
      
      // Parse DD/MM/YYYY format
      const [day, month, year] = row.date.split('/').map(Number);
      return month === 1 && year === 2025 && day <= 7 && row.mediaBuyer === buyer;
    });
  }, [data.tableData, buyer]);

  const metrics = useMemo(() => {
    // Use the same date filtering logic as filteredData
    const mtdData = filteredData.filter(row => {
      if (typeof row.date !== 'string') return false;
      const [day, month, year] = row.date.split('/').map(Number);
      
      switch (timeRange) {
        case 'eod':
          return day === 7 && month === 1 && year === 2025;
        case '7d': {
          return day <= 7 && month === 1 && year === 2025;
        }
        case 'mtd': {
          return month === 1 && year === 2025 && day <= 7;
        }
        default:
          return true;
      }
    });

    return mtdData.reduce(
      (acc, row) => ({
        spend: acc.spend + row.adSpend,
        revenue: acc.revenue + row.adRev,
        profit: acc.profit + row.profit
      }),
      { spend: 0, revenue: 0, profit: 0 }
    );
  }, [filteredData, timeRange]);

  const { offerPerformance, accountPerformance } = useMemo(() => {
    const byOffer = filteredData.reduce((acc, row) => {
      // Use combination of network and offer without hyphen
      const key = `${row.network} ${row.offer}`;
      
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
    }, {} as Record<string, { 
      name: string; 
      profit: number; 
      spend: number; 
      revenue: number; 
    }>);

    const byAccount = filteredData.reduce((acc, row) => {
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
    }, {} as Record<string, { 
      name: string; 
      profit: number; 
      spend: number; 
      revenue: number; 
    }>);

    return {
      offerPerformance: Object.values(byOffer).sort((a, b) => b.profit - a.profit),
      accountPerformance: Object.values(byAccount).sort((a, b) => b.profit - a.profit)
    };
  }, [filteredData]);

  const dailyProfitData = useMemo(() => {
    const parseDate = (dateStr: string | Date) => {
      if (dateStr instanceof Date) return dateStr;
      
      // Parse DD/MM/YYYY format
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const dailyProfits = new Map();

    // Process each row
    filteredData.forEach(row => {
      try {
        const date = parseDate(row.date);
        // Format as DD/MM/YYYY
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        const currentProfit = dailyProfits.get(formattedDate)?.profit || 0;
        dailyProfits.set(formattedDate, {
          date: formattedDate,
          profit: currentProfit + Number(row.profit)
        });
      } catch (e) {
        console.error('Error processing row:', row, e);
      }
    });

    // Fill in missing dates with zero profit
    const startDate = new Date(2025, 0, 1);  // January 1st, 2025
    const endDate = new Date(2025, 0, 7);    // January 7th, 2025

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      if (!dailyProfits.has(formattedDate)) {
        dailyProfits.set(formattedDate, {
          date: formattedDate,
          profit: 0
        });
      }
    }

    return Array.from(dailyProfits.values())
      .sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredData]);

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
              <SelectItem value="eod">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
        />
      </div>

      <DailyProfitChart 
        data={dailyProfitData} 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryTable data={offerPerformance} title={`${buyer}'s Offer Summary`} />
        <SummaryTable data={accountPerformance} title={`${buyer}'s Account Summary`} />
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