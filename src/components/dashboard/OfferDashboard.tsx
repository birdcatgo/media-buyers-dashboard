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
  return data.filter(row => {
    if (typeof row.date !== 'string') return false;
    
    // Parse DD/MM/YYYY format
    const [day, month, year] = row.date.split('/').map(Number);
    
    switch (timeRange) {
      case 'eod':
        return day === 7 && month === 1 && year === 2025;  // January 7th, 2025
      case '7d': {
        // Include data from Jan 1-7
        return month === 1 && year === 2025 && day <= 7;
      }
      case 'mtd': {
        // Include all January data up to the 7th
        return month === 1 && year === 2025 && day <= 7;
      }
      case '90d': {
        // For now, just show January data since that's all we have
        return month === 1 && year === 2025 && day <= 7;
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
      // Special handling for Suited - ACA
      if (row.network === 'Suited' && row.offer === 'ACA') {
        combinations.add('ACA - ACA');
      } else {
        combinations.add(`${row.network} - ${row.offer}`);
      }
    });
    return Array.from(combinations).sort();
  }, [data.tableData]);

  // Filter and prepare data for each network-offer
  const offerData = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    
    // First, map any Suited ACA to ACA ACA
    const normalizedData = filteredTableData.map(row => ({
      ...row,
      network: (row.network === 'Suited' && row.offer === 'Health' && row.adAccount === 'ACA DQ Rev') ? 'ACA' : row.network,
      offer: (row.network === 'Suited' && row.offer === 'Health' && row.adAccount === 'ACA DQ Rev') ? 'ACA' : row.offer
    }));

    // Then group by network-offer
    return networkOffers.map(networkOffer => {
      const [network, offer] = networkOffer.split(' - ');
      
      // Filter data for this network-offer combination
      const filteredData = normalizedData.filter(row => {
        // Special handling for ACA
        if (network === 'ACA' && offer === 'ACA') {
          return (row.network === 'ACA' && row.offer === 'ACA') || 
                 (row.network === 'Suited' && row.offer === 'Health' && row.adAccount === 'ACA DQ Rev');
        }
        return row.network === network && row.offer === offer;
      });

      // Calculate metrics
      const metrics = filteredData.reduce(
        (acc, row) => ({
          spend: acc.spend + row.adSpend,
          revenue: acc.revenue + row.adRev,
          profit: acc.profit + row.profit
        }),
        { spend: 0, revenue: 0, profit: 0 }
      );

      return {
        name: networkOffer,
        ...metrics
      };
    });
  }, [data.tableData, networkOffers, timeRange]);

  // Add this new useMemo for the combined data
  const combinedData = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    const dailyTotals = new Map<string, Record<string, number>>();
    
    filteredTableData.forEach(row => {
      let key = `${row.network} - ${row.offer}`;
      // Special handling for Suited - ACA
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
        const [aDay, aMonth] = a.date.split('/').map(Number);
        const [bDay, bMonth] = b.date.split('/').map(Number);
        return (aMonth - bMonth) || (aDay - bDay);
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