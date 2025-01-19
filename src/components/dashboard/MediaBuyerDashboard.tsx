import { MediaBuyerHighlights } from './MediaBuyerHighlights';
import { useHighlights } from '@/hooks/useHighlights';
import { DashboardData } from '@/types/dashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import { filterDataByDateRange, getLatestDate } from '@/utils/dateUtils';

interface DataPoint {
  date: string;
  [key: string]: number | string;  // Allow string keys for offers
}

const getOfferName = (row: any): string => {
  if (!row?.network || !row?.offer) return '';
  const network = String(row.network).trim();
  const offer = String(row.offer).trim();
  if (network === 'undefined' || offer === 'undefined') return '';
  return `${network} - ${offer}`;
};

export const MediaBuyerProfitChart = ({ 
  data,
  selectedOffers,
  offers,
  setSelectedOffers,
  mediaBuyer
}: { 
  data: any[];
  selectedOffers: string[];
  offers: string[];
  setSelectedOffers: (offers: string[]) => void;
  mediaBuyer: string;
}) => {
  const processedData = useMemo(() => {
    const buyerData = data.filter(row => {
      if (!row?.date || !row?.mediaBuyer || row.mediaBuyer !== mediaBuyer) {
        return false;
      }
      const offerName = getOfferName(row);
      return offerName && selectedOffers.includes(offerName);
    });

    const dailyData = new Map();
    
    buyerData.forEach(row => {
      const date = row.date;
      const offerName = getOfferName(row);
      
      if (!dailyData.has(date)) {
        const dateEntry: { date: string; [key: string]: number | string } = { date };
        selectedOffers.forEach(offer => dateEntry[offer] = 0);
        dailyData.set(date, dateEntry);
      }
      
      const entry = dailyData.get(date);
      if (entry && typeof row.profit === 'number') {
        entry[offerName] = (entry[offerName] || 0) + row.profit;
      }
    });

    return Array.from(dailyData.values()).sort((a, b) => {
      const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
      const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
      return new Date(aYear, aMonth - 1, aDay).getTime() - 
             new Date(bYear, bMonth - 1, bDay).getTime();
    });
  }, [data, selectedOffers, mediaBuyer]);

  return (
    <div className="h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 80, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Daily Profit']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          {selectedOffers.map((offer, index) => {
            const color = `hsl(${(index * 360) / selectedOffers.length}, 70%, 50%)`;
            return (
              <Line
                key={offer}
                type="monotone"
                dataKey={offer}
                name={offer}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: color }}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MediaBuyerDashboard = ({
  data,
  mediaBuyer,
  dateRange = 'mtd'
}: {
  data: DashboardData;
  mediaBuyer: string;
  dateRange?: 'yesterday' | 'mtd' | '7d' | 'all';
}) => {
  const { buyerHighlights } = useHighlights(data);
  const highlights = buyerHighlights[mediaBuyer] || [];
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  
  // Get unique offers
  const offers = useMemo(() => {
    // First get all valid offer combinations for this buyer
    const validOffers = data.tableData
      .filter(row => 
        row.mediaBuyer === mediaBuyer &&
        row.network &&
        row.offer &&
        String(row.network).trim() !== '' &&
        String(row.offer).trim() !== '' &&
        String(row.network) !== 'undefined' &&
        String(row.offer) !== 'undefined'
      )
      .map(row => getOfferName(row))
      .filter(offerName => 
        offerName && 
        offerName !== ' - ' && 
        !offerName.includes('undefined')
      );

    // Use Set to get unique values
    const uniqueOffers = Array.from(new Set(validOffers)).sort();

    console.log('Offer generation:', {
      mediaBuyer,
      totalRows: data.tableData.length,
      validOffers: uniqueOffers,
      sampleRow: data.tableData[0]
    });

    return uniqueOffers;
  }, [data.tableData, mediaBuyer]);

  // Update the useEffect to only set initial offers if we have valid ones
  useEffect(() => {
    if (offers.length > 0) {
      setSelectedOffers(offers);
    }
  }, [offers]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return filterDataByDateRange(data.tableData, dateRange);
  }, [data.tableData, dateRange]);

  return (
    <div className="space-y-8">
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Performance Highlights</h2>
        <MediaBuyerHighlights highlights={highlights} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaBuyerProfitChart 
            data={filteredData}
            selectedOffers={selectedOffers}
            offers={offers}
            setSelectedOffers={setSelectedOffers}
            mediaBuyer={mediaBuyer}
          />
        </CardContent>
      </Card>
    </div>
  );
};