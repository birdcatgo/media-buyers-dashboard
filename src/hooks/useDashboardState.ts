// src/hooks/useDashboardState.ts

'use client';

import { useState, useEffect } from 'react';
import { parse, format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { DashboardData, TableData } from '../types/dashboard';
import { fetchGoogleSheetsData } from '../lib/googleSheets';
import { formatDate } from '../utils/dateUtils';

export type DateRange = 'eod' | '7d' | 'mtd' | 'all';

const defaultDateRange: DateRange = 'eod';

const defaultData: DashboardData = {
  dailyData: [],
  offerData: [],
  networkData: [],
  tableData: []
};

const PST_TIMEZONE = 'America/Los_Angeles';

function parseRowDate(row: TableData): TableData {
  if (typeof row.date === 'string' && row.date.trim()) {
    // Attempt to parse "MM/dd/yyyy"
    const dt = parse(row.date, 'MM/dd/yyyy', new Date());
    if (!isNaN(dt.getTime())) {
      row.date = dt; // Assign only if valid
    }
  }
  return row;
}

function getLatestDate(data: TableData[]) {
  const validTimes = data
    .filter(r => r.date instanceof Date && !isNaN((r.date as Date).getTime()))
    .map(r => (r.date as Date).getTime());
  return validTimes.length ? new Date(Math.max(...validTimes)) : new Date();
}

function getDateFilteredData(data: TableData[], range: DateRange, latestDate: Date) {
  return data.filter((row) => {
    if (!(row.date instanceof Date)) return false;
    if (isNaN((row.date as Date).getTime())) return false;

    const rowDate = row.date as Date;
    switch (range) {
      case 'eod': {
        return rowDate.toDateString() === latestDate.toDateString();
      }
      case '7d': {
        const weekAgo = new Date(latestDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return rowDate >= weekAgo && rowDate <= latestDate;
      }
      case 'mtd': {
        const startOfMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        return rowDate >= startOfMonth && rowDate <= latestDate;
      }
      default:
        return true; // 'all'
    }
  });
}

// Get PST date
const getPSTDate = () => {
  // Get current time in PST
  const pstDate = new Date(formatInTimeZone(new Date(), PST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"));
  console.log('PST Date:', {
    pstDate,
    formatted: formatInTimeZone(pstDate, PST_TIMEZONE, 'dd/MM/yyyy')
  });
  return pstDate;
};

// Get yesterday in PST
const getYesterday = () => {
  const pstNow = getPSTDate();
  return subDays(pstNow, 1);
};

// Get MTD range in PST
const getMTDRange = () => {
  const pstNow = getPSTDate();
  return {
    start: startOfMonth(pstNow),
    end: pstNow
  };
};

const processTableData = (rawData: TableData[], viewMode: 'yesterday' | 'mtd' | 'custom'): TableData[] => {
  const pstNow = getPSTDate();
  const yesterday = subDays(pstNow, 1);
  const yesterdayStr = formatInTimeZone(yesterday, PST_TIMEZONE, 'dd/MM/yyyy');
  const monthStart = startOfMonth(pstNow);
  
  console.log('Date debug:', {
    viewMode,
    pstNow: formatInTimeZone(pstNow, PST_TIMEZONE, 'dd/MM/yyyy'),
    yesterday: yesterdayStr,
    monthStart: formatInTimeZone(monthStart, PST_TIMEZONE, 'dd/MM/yyyy')
  });

  // First, ensure all dates are properly formatted strings
  const safeData = rawData.map(row => ({
    ...row,
    date: formatDate(row.date)
  }));

  const filteredData = safeData.filter(row => {
    const rowDateStr = String(row.date).trim();
    
    switch(viewMode) {
      case 'yesterday':
        const matches = rowDateStr === yesterdayStr;
        console.log('Yesterday comparison:', { rowDateStr, yesterdayStr, matches });
        return matches;
        
      case 'mtd':
        try {
          const rowDate = parse(rowDateStr, 'dd/MM/yyyy', new Date());
          return isWithinInterval(rowDate, {
            start: monthStart,
            end: pstNow
          });
        } catch (e) {
          console.error('Date parsing error:', { rowDateStr, error: e });
          return false;
        }
        
      default:
        return true;
    }
  });

  // Ensure all values are strings
  return filteredData.map(row => ({
    ...row,
    date: String(row.date).trim(),
    mediaBuyer: String(row.mediaBuyer).trim(),
    network: String(row.network).trim(),
    offer: String(row.offer).trim(),
    adAccount: String(row.adAccount).trim(),
    adRev: Number(row.adRev) || 0,
    adSpend: Number(row.adSpend) || 0,
    profit: Number(row.profit) || 0
  }));
};

const parseDate = (dateValue: string): Date => {
  try {
    const parsedDate = parse(dateValue, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsedDate.getTime())) {
      return new Date(formatInTimeZone(parsedDate, PST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"));
    }
  } catch (e) {
    console.error('Date parsing error for value:', dateValue, e);
  }
  return getPSTDate();
};

const formatDateInPST = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  return formatInTimeZone(date, PST_TIMEZONE, 'dd/MM/yyyy');
};

export const getDefaultDates = (viewMode: 'yesterday' | 'mtd' | 'custom'): { start: string; end: string } => {
  const pstNow = getPSTDate();
  
  switch(viewMode) {
    case 'yesterday': {
      const yesterdayStr = formatInTimeZone(subDays(pstNow, 1), PST_TIMEZONE, 'dd/MM/yyyy');
      return {
        start: yesterdayStr,
        end: yesterdayStr
      };
    }
    
    case 'mtd': {
      return {
        start: formatInTimeZone(startOfMonth(pstNow), PST_TIMEZONE, 'dd/MM/yyyy'),
        end: formatInTimeZone(pstNow, PST_TIMEZONE, 'dd/MM/yyyy')
      };
    }
    
    default:
      return getDefaultDates('yesterday');
  }
};

const formatSafeDate = (date: Date | string): string => {
  try {
    if (date instanceof Date) {
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    }
    if (typeof date === 'string' && date.includes('/')) {
      return date;
    }
    return '01/01/2025'; // Safe default
  } catch (e) {
    console.error('Date formatting error:', e);
    return '01/01/2025'; // Safe default
  }
};

const processOverviewData = (data: any[]) => {
  const combinedData = data.reduce((acc, row) => {
    // Create a unique key that combines network, offer, and media buyer
    let key = `${row.network}-${row.offer}-${row.mediaBuyer}`;
    
    // If it's Suited ACA, combine with ACA ACA
    if (row.network === 'Suited' && row.offer === 'ACA') {
      key = `ACA-ACA-${row.mediaBuyer}`;
    }
    
    if (!acc[key]) {
      acc[key] = {
        network: row.network === 'Suited' && row.offer === 'ACA' ? 'ACA' : row.network,
        offer: row.network === 'Suited' && row.offer === 'ACA' ? 'ACA' : row.offer,
        mediaBuyer: row.mediaBuyer,
        dailyAvg: 0,
        yesterdayProfit: 0,
        weekRoas: 0,
        yesterdayRoas: 0,
        adSpend: 0,
        adRev: 0,
        profit: 0
      };
    }
    
    acc[key].adSpend += row.adSpend;
    acc[key].adRev += row.adRev;
    acc[key].profit += row.profit;
    
    return acc;
  }, {});

  return Object.values(combinedData);
};

export const useDashboardState = (initialBuyer: string) => {
  const [selectedBuyer, setSelectedBuyer] = useState(initialBuyer);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>(defaultData);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const sheetData = await fetchGoogleSheetsData();
      if (sheetData?.length) {
        // Add logging to check incoming data
        console.log('Raw sheet data:', sheetData.slice(0, 3));

        const processedData = sheetData.map(row => {
          // Ensure date is in DD/MM/YYYY format
          let formattedDate = row.date;
          if (typeof row.date === 'string') {
            // Check if date is in MM/DD/YYYY format
            const [first, second, year] = row.date.split('/').map(Number);
            if (first <= 12) { // If first number could be a month
              // Convert from MM/DD/YYYY to DD/MM/YYYY
              formattedDate = `${second.toString().padStart(2, '0')}/${first.toString().padStart(2, '0')}/${year}`;
            }
          }

          return {
            ...row,
            date: formattedDate
          };
        });

        // Log processed data
        console.log('Processed data:', processedData.slice(0, 3));

        // Process the data to combine Suited ACA with ACA ACA
        const combinedData = processOverviewData(processedData);

        setData({
          ...defaultData,
          tableData: processedData,
          overviewData: combinedData
        });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sheetData = await fetchGoogleSheetsData();
        if (!sheetData?.length) return;

        const processedData = sheetData.map(row => ({
          ...row,
          date: formatSafeDate(row.date)
        }));

        setData({
          ...defaultData,
          tableData: processedData
        });

      } catch (error) {
        console.error('Data fetching error:', error);
        setData(defaultData);
      }
    };

    fetchData();
  }, []);

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

export { processTableData };
