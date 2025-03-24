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
import { HighlightsDashboard } from './HighlightsDashboard';

const DashboardMain: React.FC = () => {
  const { 
    selectedBuyer, 
    setSelectedBuyer, 
    dateRange, 
    setDateRange,
    data,
    refreshData,
    isRefreshing,
    lastRefreshTime
  } = useDashboardState('all');

  // Active media buyers
  const activeBuyers = [
    'Mike', 
    'Mike C',
    'Zel', 
    'Aakash',
    'Jose/Matt',
    'Isha',
    'Ishaan',
    'Edwin',
    'Omar',
    'Nick N',
    'Gagan'
  ];

  // Archived media buyers
  const archivedBuyers = [
    'Dave',
    'Asheesh',
    'Alex',
    'Youssef',
    'Daniel'
  ];

  const [showArchived, setShowArchived] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "highlights", label: "Highlights" },
    { value: "offers", label: "Offers" },
    { value: "monthly", label: "Monthly" },
    { value: "raw", label: "Raw Data" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onRefresh={refreshData} 
        isRefreshing={isRefreshing}
        lastRefreshTime={lastRefreshTime}
      />
      <div className="container max-w-[2000px] mx-auto p-6">
        <Card className="p-6">
          <Tabs 
            defaultValue="overview" 
            className="space-y-6"
            onValueChange={setCurrentTab}
          >
            <div className="flex flex-col gap-2">
              {/* Main tabs and active buyers */}
              <TabsList className="bg-[#450a0a]/10 p-1 rounded-lg w-full flex flex-nowrap overflow-x-auto">
                <TabsTrigger 
                  value="overview" 
                  className="whitespace-nowrap px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="highlights"
                  className="whitespace-nowrap px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Highlights
                </TabsTrigger>
                <TabsTrigger 
                  value="yesterday"
                  className="whitespace-nowrap px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Yesterday
                </TabsTrigger>
                <TabsTrigger 
                  value="mtd"
                  className="whitespace-nowrap px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  MTD
                </TabsTrigger>
                <TabsTrigger 
                  value="offers"
                  className="whitespace-nowrap px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                >
                  Offers
                </TabsTrigger>

                {/* Active Media Buyers */}
                {activeBuyers.map(buyer => (
                  <TabsTrigger 
                    key={buyer} 
                    value={buyer.toLowerCase()} 
                    className="whitespace-nowrap px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                  >
                    {buyer}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Archive and Raw Data on second line */}
              <TabsList className="bg-[#450a0a]/10 p-1 rounded-lg w-full flex gap-2">
                {/* Archive Dropdown */}
                <div className="relative">
                  <TabsTrigger 
                    value="archive"
                    className="px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
                    onClick={() => setShowArchived(!showArchived)}
                  >
                    Archive ▼
                  </TabsTrigger>
                  {showArchived && (
                    <div className="absolute top-full left-0 w-48 mt-1 bg-white border rounded-md shadow-lg z-50">
                      {archivedBuyers.map(buyer => (
                        <TabsTrigger 
                          key={buyer} 
                          value={buyer.toLowerCase()} 
                          className="w-full px-4 py-2 hover:bg-gray-100 text-left"
                        >
                          {buyer}
                        </TabsTrigger>
                      ))}
                    </div>
                  )}
                </div>

                <TabsTrigger 
                  value="raw"
                  className="px-4 py-2 rounded-md data-[state=active]:bg-[#450a0a] data-[state=active]:text-white transition-all"
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

            {/* Active Buyers Content */}
            {activeBuyers.map(buyer => (
              <TabsContent key={buyer} value={buyer.toLowerCase()}>
                <BuyerDashboard 
                  buyer={buyer}
                  data={data}
                />
              </TabsContent>
            ))}

            {/* Archived Buyers Content */}
            {archivedBuyers.map(buyer => (
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

            <TabsContent value="highlights">
              <HighlightsDashboard data={data} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMain;