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
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [data, setData] = useState<DashboardData>({
    dailyData: [],
    offerData: [],
    networkData: [],
    tableData: []
  });

  const refreshData = async (forceRefresh: boolean = false) => {
    setIsRefreshing(true);
    try {
      // Add a timestamp to prevent caching
      const timestamp = Date.now();
      const sheetData = await fetchGoogleSheetsData(timestamp);
      
      console.log('Fetching fresh data:', {
        timestamp: new Date().toISOString(),
        rowCount: sheetData?.length,
        forceRefresh,
        dateRange,
        sampleData: sheetData?.slice(0, 3)
      });

      if (sheetData?.length) {
        // Clear any existing data first
        setData({
          dailyData: [],
          offerData: [],
          networkData: [],
          tableData: []
        });

        // Process the raw data with a small delay to ensure state clear
        setTimeout(() => {
          const processedData = sheetData.map(row => ({
            ...row,
            date: row.date,
            adSpend: processNumericValue(row.adSpend),
            adRev: processNumericValue(row.adRev),
            profit: processNumericValue(row.profit),
            revenue: processNumericValue(row.adRev),
            name: `${row.network} - ${row.offer}`
          }));

          // Update with new data
          const newData: DashboardData = {
            dailyData: processedData,
            offerData: processedData,
            networkData: processedData,
            tableData: processedData
          };

          setData(newData);
          setLastRefreshTime(Date.now());

          console.log('Data refresh complete:', {
            timestamp: new Date().toISOString(),
            processedRows: processedData.length,
            uniqueDates: Array.from(new Set(processedData.map(row => row.date))).sort(),
            uniqueBuyers: Array.from(new Set(processedData.map(row => row.mediaBuyer))).sort()
          });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    refreshData(true);
  }, []);

  // Refresh data when date range changes
  useEffect(() => {
    refreshData(true);
  }, [dateRange]);

  // Add an interval to check for updates more frequently (every 1 minute)
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData(true); // Force refresh every time
    }, 60 * 1000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  return {
    selectedBuyer,
    setSelectedBuyer,
    dateRange,
    setDateRange,
    data,
    refreshData: () => refreshData(true),
    isRefreshing,
    lastRefreshTime
  };
};