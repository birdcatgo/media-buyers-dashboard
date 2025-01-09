import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { DashboardData } from '@/types/dashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDollar } from '@/utils/formatters';

type TimeRange = 'eod' | '7d' | 'mtd' | '90d';

// Add this type for our data points
type DataPoint = {
  date: string;
  profit: number;
  spend: number;
  revenue: number;
};

// Add this helper function at the top
const validateDates = (data: any[]) => {
  const dateMap = new Map<string, any[]>();
  const invalidDates: any[] = [];

  data.forEach(row => {
    try {
      if (typeof row.date !== 'string') {
        invalidDates.push(row);
        return;
      }

      const [month, day, year] = row.date.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        invalidDates.push(row);
        return;
      }

      const key = row.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, []);
      }
      dateMap.get(key)?.push(row);
    } catch (e) {
      invalidDates.push(row);
    }
  });

  return {
    validDates: Array.from(dateMap.entries()).map(([date, rows]) => ({
      date,
      rowCount: rows.length,
      sampleRows: rows.slice(0, 2)
    })),
    invalidDates,
    dateDistribution: Array.from(dateMap.keys()).sort(),
    summary: {
      totalRows: data.length,
      validRows: data.length - invalidDates.length,
      uniqueDates: dateMap.size
    }
  };
};

// Update getFilteredData with logging
const getFilteredData = (data: any[], timeRange: TimeRange) => {
  const filtered = data.filter(row => {
    if (typeof row.date !== 'string') return false;
    
    const [month, day, year] = row.date.split('/').map(Number);
    
    // Log any parsing issues
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      console.warn('Invalid date format:', row.date);
      return false;
    }

    const result = (() => {
      switch (timeRange) {
        case 'eod':
          return month === 1 && day === 8 && year === 2025;
        case '7d':
          return month === 1 && year === 2025 && day >= 1 && day <= 8;
        case 'mtd':
          return month === 1 && year === 2025;
        case '90d':
          return ((month === 12 && year === 2024) || 
                  (month === 1 && year === 2025));
        default:
          return true;
      }
    })();

    // Log filtered dates
    if (result) {
      console.log('Including date:', {
        original: row.date,
        parsed: { month, day, year },
        timeRange
      });
    }

    return result;
  });

  // Log filtering results
  console.log('Filtered Results:', {
    timeRange,
    totalRows: data.length,
    filteredRows: filtered.length,
    uniqueDates: Array.from(new Set(filtered.map(row => row.date))).sort()
  });

  return filtered;
};

export const OfferDashboard = ({
  data
}: {
  data: DashboardData;
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('mtd');

  // Add date validation logging
  console.log('Date Validation:', validateDates(data.tableData));

  // Get unique network-offer combinations
  const networkOffers = useMemo(() => {
    const combinations = new Set<string>();
    data.tableData.forEach(row => {
      // Special handling for Suited - ACA
      if (row.network === 'Suited' && row.offer === 'ACA') {
        combinations.add('ACA - ACA');
      } else {
        combinations.add(`${row.network} - ${row.offer}`);
      }
    });
    return Array.from(combinations).sort();
  }, [data.tableData]);

  // Add this new useMemo for the combined data
  const combinedData = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    const dailyTotals = new Map<string, Record<string, number>>();
    
    // Debug log
    console.log('Filtered data:', {
      total: filteredTableData.length,
      uniqueDates: Array.from(new Set(filteredTableData.map(row => row.date))).sort(),
      sampleRow: filteredTableData[0]
    });
    
    filteredTableData.forEach(row => {
      let key = `${row.network} - ${row.offer}`;
      if (row.network === 'Suited' && row.offer === 'ACA') {
        key = 'ACA - ACA';
      }

      if (!dailyTotals.has(row.date)) {
        dailyTotals.set(row.date, {});
      }
      const dayData = dailyTotals.get(row.date)!;
      if (!dayData[key]) {
        dayData[key] = 0;
      }
      dayData[key] += row.profit;
    });

    return Array.from(dailyTotals.entries())
      .map(([date, profits]) => ({
        date,
        ...profits
      }))
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        const dateA = new Date(aYear, aMonth - 1, aDay);
        const dateB = new Date(bYear, bMonth - 1, bDay);
        return dateA.getTime() - dateB.getTime();
      });
  }, [data.tableData, timeRange]);

  // Add this at the top of the component, after the useMemos
  const sortedOfferPerformance = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    const metrics = new Map<string, { spend: number; revenue: number; profit: number }>();

    filteredTableData.forEach(row => {
      let key = `${row.network} - ${row.offer}`;
      // Special handling for Suited - ACA
      if (row.network === 'Suited' && row.offer === 'ACA') {
        key = 'ACA - ACA';
      }

      const current = metrics.get(key) || { spend: 0, revenue: 0, profit: 0 };
      metrics.set(key, {
        spend: current.spend + row.adSpend,
        revenue: current.revenue + row.adRev,
        profit: current.profit + row.profit
      });
    });

    return Array.from(metrics.entries())
      .map(([name, values]) => ({
        name,
        ...values
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [data.tableData, timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offer Performance</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eod">Yesterday</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Offers Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Performance Table */}
          <div className="mb-12 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Offer</th>
                  <th className="text-right p-2">Spend</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedOfferPerformance.map(({ name, spend, revenue, profit }) => (
                  <tr key={name} className="border-b">
                    <td className="p-2">{name}</td>
                    <td className="text-right p-2">{formatDollar(spend)}</td>
                    <td className="text-right p-2">{formatDollar(revenue)}</td>
                    <td className="text-right p-2">{formatDollar(profit)}</td>
                    <td className="text-center p-2">
                      {profit > 3000 ? '🟢' : profit > 1000 ? '🟡' : profit > 0 ? '🟠' : '🔴'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart Title */}
          <h3 className="text-lg font-semibold mb-6 text-center">
            Daily Profit by Offer
          </h3>

          {/* Enhanced Main Chart */}
          <div className="h-[500px] flex">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={combinedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`, 
                    name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={48}
                  wrapperStyle={{ 
                    fontSize: '12px',
                    paddingTop: '20px'
                  }}
                />
                <ReferenceLine y={0} stroke="#666" />
                {networkOffers.map((offer, index) => (
                  <Line
                    key={offer}
                    type="monotone"
                    dataKey={offer}
                    name={offer}
                    stroke={`hsl(${(index * 360) / networkOffers.length}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 