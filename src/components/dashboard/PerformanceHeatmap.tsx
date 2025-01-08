// src/components/dashboard/PerformanceHeatmap.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TableData } from '@/types/dashboard';

interface NetworkOfferStats {
 network: string;
 offer: string;
 profit: number;
 volume: number;
 roi: number;
}

interface GroupedData {
 [key: string]: NetworkOfferStats;
}

const PerformanceHeatmap = ({ data }: { data: TableData[] }) => {
 const networkOfferData = React.useMemo(() => {
   const grouped = data.reduce((acc: GroupedData, row) => {
     const key = `${row.network}-${row.offer}`;
     if (!acc[key]) {
       acc[key] = {
         network: row.network,
         offer: row.offer,
         profit: 0,
         volume: 0,
         roi: 0
       };
     }
     acc[key].profit += row.profit;
     acc[key].volume += row.adRev;
     acc[key].roi = (acc[key].profit / acc[key].volume) * 100;
     return acc;
   }, {});

   return Object.values(grouped)
     .sort((a, b) => b.profit - a.profit); // Sort by profit descending
 }, [data]);

 const getColorIntensity = (profit: number) => {
   const maxProfit = Math.max(...networkOfferData.map(d => d.profit));
   const intensity = Math.min((profit / maxProfit) * 100, 100);
   return profit >= 0 
     ? `rgba(0, 255, 0, ${intensity/100})`
     : `rgba(255, 0, 0, ${Math.abs(intensity)/100})`;
 };

 return (
   <Card className="w-full mt-6">
     <CardHeader>
       <CardTitle>Campaign Performance Heat Map</CardTitle>
     </CardHeader>
     <CardContent>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {networkOfferData.map((item, idx) => (
           <div 
             key={idx}
             className="p-4 rounded-lg shadow-md transition-all hover:scale-105"
             style={{ 
               backgroundColor: getColorIntensity(item.profit),
               color: Math.abs(item.profit) > 1000 ? 'white' : 'black'
             }}
           >
             <div className="flex flex-col gap-2">
               <div className="text-lg font-bold">
                 {item.network} - {item.offer}
               </div>
               <div className="grid grid-cols-2 gap-2 text-sm">
                 <div>Profit:</div>
                 <div className="text-right">${item.profit.toLocaleString()}</div>
                 <div>ROI:</div>
                 <div className="text-right">{item.roi.toFixed(1)}%</div>
                 <div>Volume:</div>
                 <div className="text-right">${item.volume.toLocaleString()}</div>
               </div>
             </div>
           </div>
         ))}
       </div>
     </CardContent>
   </Card>
 );
};

export default PerformanceHeatmap;