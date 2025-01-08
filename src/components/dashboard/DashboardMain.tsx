import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DailyMetrics } from './DailyMetrics';
import { MonthlyMetrics } from './MonthlyMetrics';
import { RawData } from './RawData';
import { BuyerDashboard } from './IndividualBuyerDashboard';
import { DashboardHeader } from './DashboardHeader';
import { Card } from "@/components/ui/card";
import { useDashboardState } from '@/hooks/useDashboardState';
import { OfferDashboard } from './OfferDashboard';
import { OverviewDashboard } from './OverviewDashboard';

const DashboardMain: React.FC = () => {
  const { 
    selectedBuyer, 
    setSelectedBuyer, 
    dateRange, 
    setDateRange,
    data,
    refreshData,
    isRefreshing 
  } = useDashboardState('all');

  const mediaBuyers = ['Mike', 'Asheesh', 'Dave', 'Zel', 'Daniel', 'Alex'];

  const [currentTab, setCurrentTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onRefresh={refreshData} isRefreshing={isRefreshing} />
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <Tabs 
            defaultValue="overview" 
            className="space-y-6"
            onValueChange={setCurrentTab}
          >
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-[#450a0a]/10 p-1 rounded-lg w-full flex">
                <TabsTrigger 
                  value="overview" 
                  className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="yesterday"
                  className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Yesterday
                </TabsTrigger>
                <TabsTrigger 
                  value="mtd"
                  className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  MTD
                </TabsTrigger>
                <TabsTrigger 
                  value="offers"
                  className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Offers
                </TabsTrigger>
                {mediaBuyers.map(buyer => (
                  <TabsTrigger 
                    key={buyer} 
                    value={buyer.toLowerCase()} 
                    className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                  >
                    {buyer}
                  </TabsTrigger>
                ))}
                <TabsTrigger 
                  value="raw"
                  className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Raw Data
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <OverviewDashboard data={data} />
            </TabsContent>

            <TabsContent value="yesterday">
              <DailyMetrics 
                buyer={selectedBuyer}
                data={data}
              />
            </TabsContent>

            <TabsContent value="mtd">
              <MonthlyMetrics 
                buyer={selectedBuyer}
                data={data}
              />
            </TabsContent>

            <TabsContent value="offers">
              <OfferDashboard data={data} />
            </TabsContent>

            {mediaBuyers.map(buyer => (
              <TabsContent key={buyer} value={buyer.toLowerCase()}>
                <BuyerDashboard 
                  buyer={buyer}
                  data={data}
                />
              </TabsContent>
            ))}

            <TabsContent value="raw">
              <RawData 
                buyer={selectedBuyer}
                data={data}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMain;