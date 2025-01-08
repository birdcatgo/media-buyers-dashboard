import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { formatDollar } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, icon }: MetricCardProps) => (
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

interface Props {
  buyer: string;
  data: DashboardData;
  offer?: string;
  network?: string;
}

const ProfitChart = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Daily Profit Trend</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[400px]">
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
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

export const BuyerDashboard = ({ buyer, data, offer = 'all', network = 'all' }: Props) => {
  const metrics = useMemo(() => {
    const filtered = data.tableData.filter(row => row.mediaBuyer === buyer);
    return filtered.reduce(
      (acc, row) => ({
        spend: acc.spend + row.adSpend,
        revenue: acc.revenue + row.adRev,
        profit: acc.profit + row.profit
      }),
      { spend: 0, revenue: 0, profit: 0 }
    );
  }, [data.tableData, buyer]);

  const performanceData = useMemo(() => {
    return data.tableData
      .filter(row => row.mediaBuyer === buyer)
      .map(row => ({
        name: row.offer,
        spend: row.adSpend,
        revenue: row.adRev,
        profit: row.profit
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [data.tableData, buyer]);

  const dailyProfitData = useMemo(() => {
    const dailyProfits = new Map<string, number>();
    
    // Filter for this buyer's data
    const buyerData = data.tableData.filter(row => row.mediaBuyer === buyer);
    
    // Group profits by date
    buyerData.forEach(row => {
      if (typeof row.date !== 'string') return;
      
      const currentProfit = dailyProfits.get(row.date) || 0;
      dailyProfits.set(row.date, currentProfit + row.profit);
    });

    // Convert to array and sort by date
    return Array.from(dailyProfits.entries())
      .map(([date, profit]) => ({
        date,
        profit
      }))
      .sort((a, b) => {
        const [aDay, aMonth] = a.date.split('/').map(Number);
        const [bDay, bMonth] = b.date.split('/').map(Number);
        return (aMonth - bMonth) || (aDay - bDay);
      });
  }, [data.tableData, buyer]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{buyer}'s Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Spend"
          value={metrics.spend}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <MetricCard
          title="Total Profit"
          value={metrics.profit}
          icon={<PieChart className="h-6 w-6" />}
        />
      </div>

      <ProfitChart data={dailyProfitData} />

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {performanceData.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.name}</td>
                    <td className="text-right p-2">{formatDollar(row.spend)}</td>
                    <td className="text-right p-2">{formatDollar(row.revenue)}</td>
                    <td className="text-right p-2">{formatDollar(row.profit)}</td>
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