'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { normalizeNetworkOffer } from '@/utils/dataUtils';

interface ChartProps {
  data: {
    dailyData: any[];
    offerData: any[];
    networkData: any[];
  };
}

const DailyPerformanceChart = ({ data }: { data: any[] }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="adSpend" 
                stroke="#82ca9d"
                name="Ad Spend" 
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#ffc658"
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const PerformanceChart = ({ data, title }: { data: any[], title: string }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardCharts = ({ data }: ChartProps) => {
  // Normalize and combine the data
  const processedData = useMemo(() => {
    // Process daily data
    const dailyMap = new Map<string, any>();
    
    data.dailyData.forEach(row => {
      const key = row.date;
      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          date: key,
          revenue: 0,
          adSpend: 0,
          profit: 0
        });
      }
      
      const current = dailyMap.get(key)!;
      // Always add the values, regardless of network/offer
      current.revenue += row.revenue || 0;
      current.adSpend += row.adSpend || 0;
      current.profit += row.profit || 0;
    });

    // Process offer data
    const offerMap = new Map<string, any>();
    data.offerData.forEach(row => {
      // Normalize the key for both ACA ACA and Suited ACA
      const key = (row.network === 'Suited' && row.offer === 'ACA') ? 'ACA - ACA' : `${row.network} - ${row.offer}`;
      
      if (!offerMap.has(key)) {
        offerMap.set(key, {
          name: key,
          revenue: 0,
          profit: 0,
          adSpend: 0
        });
      }
      
      const current = offerMap.get(key)!;
      current.revenue += row.revenue || 0;
      current.profit += row.profit || 0;
      current.adSpend += row.adSpend || 0;
    });

    return {
      dailyData: Array.from(dailyMap.values()),
      offerData: Array.from(offerMap.values()),
      networkData: data.networkData
    };
  }, [data]);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="offers">Offers</TabsTrigger>
        <TabsTrigger value="networks">Networks</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <DailyPerformanceChart data={processedData.dailyData} />
          <PerformanceChart data={processedData.offerData} title="Performance by Offer" />
        </div>
      </TabsContent>

      <TabsContent value="offers">
        <PerformanceChart data={processedData.offerData} title="Offer Performance" />
      </TabsContent>

      <TabsContent value="networks">
        <PerformanceChart data={processedData.networkData} title="Network Performance" />
      </TabsContent>
    </Tabs>
  );
};