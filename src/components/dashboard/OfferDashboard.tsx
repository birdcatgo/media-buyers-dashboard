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

// First, add the date filtering function
const getFilteredData = (data: any[], timeRange: TimeRange) => {
  const endDate = new Date('2025-01-06');
  return data.filter(row => {
    if (typeof row.date !== 'string') return false;
    const [mm, dd, yyyy] = row.date.split('/').map(Number);
    const rowDate = new Date(yyyy, mm - 1, dd);
    
    switch (timeRange) {
      case 'eod':
        return mm === 1 && dd === 6 && yyyy === 2025;  // January 6th, 2025
      case '7d': {
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        return rowDate >= startDate && rowDate <= endDate;
      }
      case 'mtd': {
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        return rowDate >= startDate && rowDate <= endDate;
      }
      default:
        return true;
    }
  });
};

export const OfferDashboard = ({
  data
}: {
  data: DashboardData;
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('mtd');

  // Get unique network-offer combinations
  const networkOffers = useMemo(() => {
    const combinations = new Set<string>();
    data.tableData.forEach(row => {
      combinations.add(`${row.network} - ${row.offer}`);
    });
    return Array.from(combinations).sort();
  }, [data.tableData]);

  // Filter and prepare data for each network-offer
  const offerData = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    return networkOffers.map(networkOffer => {
      const [network, offer] = networkOffer.split(' - ');
      
      // Filter data for this network-offer
      const filteredData = filteredTableData.filter(row => 
        row.network === network && row.offer === offer
      );

      // Group by date and calculate daily metrics
      const dailyData = filteredData.reduce((acc, row) => {
        if (!acc[row.date]) {
          acc[row.date] = {
            date: row.date,
            spend: 0,
            revenue: 0,
            profit: 0
          };
        }
        acc[row.date].spend += row.adSpend;
        acc[row.date].revenue += row.adRev;
        acc[row.date].profit += row.profit;
        return acc;
      }, {} as Record<string, any>);

      // Calculate total profit for sorting
      const totalProfit = filteredData.reduce((sum, row) => sum + row.profit, 0);

      return {
        name: networkOffer,
        data: Object.values(dailyData).sort((a, b) => {
          const aDate = (a as { date: string }).date;
          const bDate = (b as { date: string }).date;
          const [aDay, aMonth] = aDate.split('/').map(Number);
          const [bDay, bMonth] = bDate.split('/').map(Number);
          return (aMonth - bMonth) || (aDay - bDay);
        }),
        totalProfit // Add total profit for sorting
      };
    }).sort((a, b) => {
      // Sort by whether they have data first, then by total profit
      const aHasData = a.data.length > 0;
      const bHasData = b.data.length > 0;
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;
      return b.totalProfit - a.totalProfit;
    });
  }, [data.tableData, networkOffers, timeRange]);

  // Add this new useMemo for the combined data
  const combinedData = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    const dailyTotals = new Map<string, Record<string, number>>();
    
    filteredTableData.forEach(row => {
      const key = `${row.network} - ${row.offer}`;
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
        const aDate = (a as { date: string }).date;
        const bDate = (b as { date: string }).date;
        const [aDay, aMonth] = aDate.split('/').map(Number);
        const [bDay, bMonth] = bDate.split('/').map(Number);
        return (aMonth - bMonth) || (aDay - bDay);
      });
  }, [data.tableData, timeRange]);

  // Add this at the top of the component, after the useMemos
  const sortedOfferPerformance = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    return networkOffers.map(networkOffer => {
      const [network, offer] = networkOffer.split(' - ');
      const offerData = filteredTableData.filter(row => 
        row.network === network && row.offer === offer
      );
      
      return {
        name: networkOffer,
        profit: offerData.reduce((sum, row) => sum + row.profit, 0),
        revenue: offerData.reduce((sum, row) => sum + row.adRev, 0),
        spend: offerData.reduce((sum, row) => sum + row.adSpend, 0)
      };
    }).sort((a, b) => b.profit - a.profit); // Sort by profit descending
  }, [data.tableData, networkOffers, timeRange]);

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

      {/* Add Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add Performance Table */}
          <div className="mb-6 overflow-x-auto">
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

          {/* Chart with adjusted legend */}
          <div className="h-[400px] flex">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    // Show the full network-offer name and the value
                    return [`$${value.toLocaleString()}`, name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                {networkOffers.map((offer, index) => (
                  <Line
                    key={offer}
                    type="monotone"
                    dataKey={offer}
                    name={offer}
                    stroke={`hsl(${(index * 360) / networkOffers.length}, 70%, 50%)`}
                    strokeWidth={2}
                    dot
                    hide={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual offer charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offerData.map(({ name, data }) => (
          <Card key={name}>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">{name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']}
                      labelFormatter={(label) => `Date: ${label}`}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 