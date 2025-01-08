import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDollar } from '@/utils/formatters';

export const DailyMetrics = ({
  buyer,
  data
}: {
  buyer: string;
  data: DashboardData;
}) => {
  // Get the latest date and filter data
  const filteredData = useMemo(() => {
    let filtered = [...data.tableData];

    // Find the latest date in the dataset
    const latestDate = filtered.reduce((latest, row) => {
      if (typeof row.date !== 'string') return latest;
      const [day, month, year] = row.date.split('/').map(Number);
      const currentDate = new Date(year, month - 1, day);
      return currentDate > latest ? currentDate : latest;
    }, new Date(0));

    // Format latest date as DD/MM/YYYY
    const formattedLatestDate = `${latestDate.getDate().toString().padStart(2, '0')}/${(latestDate.getMonth() + 1).toString().padStart(2, '0')}/${latestDate.getFullYear()}`;

    // Filter for only the latest date and apply other filters
    return filtered.filter(row => 
      row.date === formattedLatestDate && 
      (buyer === 'all' || row.mediaBuyer === buyer)
    );
  }, [data.tableData, buyer]);

  // Calculate metrics for the latest day only
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

  // Calculate performance data for charts
  const offerPerformance = useMemo(() => {
    const byOffer = filteredData.reduce((acc, row) => {
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
    }, {} as Record<string, { name: string; profit: number; spend: number; revenue: number; }>);

    return Object.values(byOffer).sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  const accountPerformance = useMemo(() => {
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
    }, {} as Record<string, { name: string; profit: number; spend: number; revenue: number; }>);

    return Object.values(byAccount);
  }, [filteredData]);

  const mediaPerformance = useMemo(() => {
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
    }, {} as Record<string, { name: string; profit: number; spend: number; revenue: number; }>);

    return Object.values(byBuyer).sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  const networkOfferPerformance = useMemo(() => {
    const byNetworkOffer = filteredData.reduce((acc, row) => {
      const key = `${row.network} - ${row.offer}`;
      if (!acc[key]) {
        acc[key] = { 
          network: row.network,
          offer: row.offer,
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
      network: string;
      offer: string;
      profit: number;
      spend: number;
      revenue: number;
    }>);

    return Object.values(byNetworkOffer).sort((a, b) => b.profit - a.profit);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Daily Spend"
          value={metrics.spend}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title="Daily Revenue"
          value={metrics.revenue}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <MetricCard
          title="Daily Profit"
          value={metrics.profit}
          icon={<PieChart className="h-6 w-6" />}
        />
      </div>

      {/* Media Buyer Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Media Buyer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Media Buyer</th>
                  <th className="text-right p-2">Spend</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {mediaPerformance.map((row, idx) => (
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

      {/* Network Offer Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Network Offer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Network</th>
                  <th className="text-left p-2">Offer</th>
                  <th className="text-right p-2">Spend</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {networkOfferPerformance.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.network}</td>
                    <td className="p-2">{row.offer}</td>
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
    </div>
  );
};

// Add PerformanceChart component
const PerformanceChart = ({ data, title }: { data: any[]; title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']} />
            <Bar dataKey="profit" fill="#22c55e">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

// Add SummaryTable component
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
              <th className="text-right p-2">Spend</th>
              <th className="text-right p-2">Revenue</th>
              <th className="text-right p-2">Profit</th>
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

// MetricCard component remains the same
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
        <h3 className="text-2xl font-bold">{formatDollar(value)}</h3>
      </div>
    </CardContent>
  </Card>
);