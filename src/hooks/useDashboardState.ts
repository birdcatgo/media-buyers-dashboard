// src/hooks/useDashboardState.ts

import { useState, useEffect } from 'react';
import { DashboardData } from '../types/dashboard';
import { fetchGoogleSheetsData } from '../lib/googleSheets';
import { 
  parseDate,
  filterDataByDateRange 
} from '../utils/dateUtils';

interface SheetRow {
  date: string;
  mediaBuyer: string;
  offer: string;
  network: string;
  adSpend: string | number;
  adRev: string | number;
  profit: string | number;
  adAccount: string;
}

const processNumericValue = (value: string | number | null): number => {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
};

export type DateRange = 'yesterday' | '7d' | 'mtd' | 'all';

export const useDashboardState = (initialBuyer: string) => {
  const [selectedBuyer, setSelectedBuyer] = useState(initialBuyer);
  const [dateRange, setDateRange] = useState<DateRange>('mtd');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    dailyData: [],
    offerData: [],
    networkData: [],
    tableData: []
  });

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const sheetData = await fetchGoogleSheetsData();
      console.log('Sheet data received:', {
        count: sheetData?.length,
        uniqueDates: Array.from(new Set(sheetData?.map(row => row.date))).sort(),
        sampleRow: sheetData?.[0]
      });
      
      if (sheetData?.length) {
        // Process the raw data
        const processedData = sheetData.map(row => ({
          ...row,
          date: row.date,  // Already in MM/DD/YYYY format
          adSpend: processNumericValue(row.adSpend),
          adRev: processNumericValue(row.adRev),
          profit: processNumericValue(row.profit),
          revenue: processNumericValue(row.adRev),
          name: `${row.network} - ${row.offer}`
        }));

        console.log('Processed dashboard data:', {
          count: processedData.length,
          sampleRow: processedData[0],
          allDates: Array.from(new Set(processedData.map(row => row.date))).sort()
        });

        const newData: DashboardData = {
          dailyData: processedData,
          offerData: processedData,
          networkData: processedData,
          tableData: processedData
        };

        setData(newData);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh data when date range changes
  useEffect(() => {
    refreshData();
  }, [dateRange]);

  return {
    selectedBuyer,
    setSelectedBuyer,
    dateRange,
    setDateRange,
    data,
    refreshData,
    isRefreshing
  };
};