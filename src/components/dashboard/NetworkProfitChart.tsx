import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TableData } from '@/types/dashboard';

interface Props {
  data: TableData[];
  selectedOffers: string[];
  networkOffers: string[];
  setSelectedOffers: (offers: string[]) => void;
}

export const NetworkProfitChart: React.FC<Props> = ({ data, selectedOffers, networkOffers, setSelectedOffers }) => {
  const chartData = React.useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const key = `${row.network}-${row.offer}`;
      if (!acc[key]) {
        acc[key] = {
          network: row.network,
          offer: row.offer,
          profit: 0,
          buyers: {}
        };
      }
      acc[key].buyers[row.mediaBuyer] = (acc[key].buyers[row.mediaBuyer] || 0) + row.profit;
      acc[key].profit += row.profit;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [data]);

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>Network & Offer Profit by Buyer</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="network" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="profit" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkProfitChart;