// src/components/dashboard/RawData.tsx

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import Papa from 'papaparse';
import { DashboardData } from '@/types/dashboard';
import { formatDollar } from '@/utils/formatters';
import { normalizeNetworkOffer } from '@/utils/dataUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TimeRange = 'yesterday' | '7d' | '14d' | 'mtd' | '30d' | '60d' | 'lastMonth' | 'ytd' | 'custom';

const DEFAULT_DATE_STRING = '2025-01-08';

const getLatestDate = (data: any[]): Date => {
  // Add more detailed logging
  console.log('Raw data dates:', {
    totalRows: data.length,
    uniqueDates: Array.from(new Set(data.map(row => row.date))).sort(),
    sampleRows: data.slice(0, 3).map(row => ({
      date: row.date,
      mediaBuyer: row.mediaBuyer,
      profit: row.profit
    }))
  });

  // First, validate and parse all dates
  const validDates = data
    .map(row => {
      if (!row.date) return null;
      const [month, day, year] = row.date.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter((date): date is Date => date !== null);

  // Find the latest date
  const latestDate = new Date(Math.max(...validDates.map(d => d.getTime())));
  
  // Debug logging
  console.log('Latest date calculation:', {
    allDates: validDates.map(d => d.toLocaleDateString('en-US')),
    maxDate: `${(latestDate.getMonth() + 1).toString().padStart(2, '0')}/${latestDate.getDate().toString().padStart(2, '0')}/${latestDate.getFullYear()}`,
    rawLatestDate: latestDate
  });

  return latestDate;
};

const formatYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DateRangeSelector = ({ 
  timeRange, 
  setTimeRange,
  customDateString,
  setCustomDateString,
  latestDate
}: { 
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
  customDateString: string;
  setCustomDateString: (date: string) => void;
  latestDate: Date;
}) => {
  // Get yesterday's date for display
  const yesterdayDate = useMemo(() => {
    const yesterday = new Date(latestDate);
    yesterday.setDate(latestDate.getDate() - 1);
    return `${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getDate().toString().padStart(2, '0')}/${yesterday.getFullYear()}`;
  }, [latestDate]);

  return (
    <div className="flex items-center gap-4">
      <select 
        className="border rounded p-1"
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
      >
        <option value="yesterday">Latest Date ({latestDate.toLocaleDateString()})</option>
        <option value="7d">Last 7 Days</option>
        <option value="14d">Last 14 Days</option>
        <option value="mtd">Month to Date</option>
        <option value="30d">Last 30 Days</option>
        <option value="60d">Last 60 Days</option>
        <option value="lastMonth">Last Month</option>
        <option value="ytd">Year to Date</option>
        <option value="custom">Custom Date</option>
      </select>
      
      {timeRange === 'custom' && (
        <input
          type="date"
          className="border rounded p-1"
          value={customDateString}
          min={formatYYYYMMDD(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1))}
          max={formatYYYYMMDD(latestDate)}
          onChange={(e) => setCustomDateString(e.target.value)}
        />
      )}
    </div>
  );
};

const FilterControls = ({
  data,
  selectedFilters,
  onFilterChange,
  showMediaBuyerFilter = true
}: {
  data: DashboardData['tableData'];
  selectedFilters: {
    mediaBuyer: string;
    adAccount: string;
    offer: string;
    network: string;
  };
  onFilterChange: (key: string, value: string) => void;
  showMediaBuyerFilter?: boolean;
}) => {
  const uniqueValues = useMemo(() => ({
    mediaBuyer: Array.from(new Set(data.map(row => row.mediaBuyer))).sort(),
    adAccount: Array.from(new Set(data.map(row => row.adAccount))).sort(),
    offer: Array.from(new Set(data.map(row => row.offer))).sort(),
    network: Array.from(new Set(data.map(row => row.network))).sort(),
  }), [data]);

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {showMediaBuyerFilter && (
        <select
          className="border rounded p-1"
          value={selectedFilters.mediaBuyer}
          onChange={(e) => onFilterChange('mediaBuyer', e.target.value)}
        >
          <option value="all">All Media Buyers</option>
          {uniqueValues.mediaBuyer.map(value => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      )}

      <select
        className="border rounded p-1"
        value={selectedFilters.adAccount}
        onChange={(e) => onFilterChange('adAccount', e.target.value)}
      >
        <option value="all">All Ad Accounts</option>
        {uniqueValues.adAccount.map(value => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>

      <select
        className="border rounded p-1"
        value={selectedFilters.offer}
        onChange={(e) => onFilterChange('offer', e.target.value)}
      >
        <option value="all">All Offers</option>
        {uniqueValues.offer.map(value => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>

      <select
        className="border rounded p-1"
        value={selectedFilters.network}
        onChange={(e) => onFilterChange('network', e.target.value)}
      >
        <option value="all">All Networks</option>
        {uniqueValues.network.map(value => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
    </div>
  );
};

interface Props {
  buyer: string;
  data: DashboardData;
  offer?: string;
  network?: string;
}

export const RawData = ({ 
  buyer, 
  data,
  offer = 'all',
  network = 'all'
}: Props) => {
  const latestDate = useMemo(() => getLatestDate(data.tableData), [data.tableData]);
  const [timeRange, setTimeRange] = useState<TimeRange>('yesterday');
  const [customDateString, setCustomDateString] = useState(formatYYYYMMDD(latestDate));
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState({
    mediaBuyer: buyer === 'all' ? 'all' : buyer,
    adAccount: 'all',
    offer: 'all',
    network: 'all'
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      mediaBuyer: buyer === 'all' ? prev.mediaBuyer : buyer
    }));
  }, [buyer]);

  const getDateRange = (timeRange: TimeRange, latestDate: Date): { start: Date, end: Date } => {
    let end = new Date(latestDate);
    let start: Date;

    switch (timeRange) {
      case 'yesterday':
        // For yesterday, we want the latest date
        start = new Date(latestDate);
        start.setHours(0, 0, 0, 0); // Start of the latest date
        end = new Date(latestDate);
        end.setHours(23, 59, 59, 999); // End of the latest date
        
        // Debug log for yesterday dates
        console.log('Yesterday date range:', {
          latestDate: `${(latestDate.getMonth() + 1).toString().padStart(2, '0')}/${latestDate.getDate().toString().padStart(2, '0')}/${latestDate.getFullYear()}`,
          start: `${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getDate().toString().padStart(2, '0')}/${start.getFullYear()}`,
          end: `${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getDate().toString().padStart(2, '0')}/${end.getFullYear()}`
        });
        
        return { start, end };
      case '7d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 6);
        break;
      case '14d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 13);
        break;
      case 'mtd':
        start = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        break;
      case '30d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 29);
        break;
      case '60d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 59);
        break;
      case 'lastMonth':
        start = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
        end = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
        break;
      case 'ytd':
        start = new Date(latestDate.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (!customDateString) return { start: end, end };
        const [year, month, day] = customDateString.split('-').map(Number);
        start = new Date(year, month - 1, day);
        break;
      default:
        return { start: end, end };
    }

    return { start, end };
  };

  const filteredData = useMemo(() => {
    let filtered = [...data.tableData];
    
    // Debug incoming data
    console.log('Initial data check:', {
      totalRows: filtered.length,
      jan16Data: filtered.filter(row => row.date === '01/16/2025').map(row => ({
        date: row.date,
        mediaBuyer: row.mediaBuyer,
        profit: row.profit
      })),
      uniqueDates: Array.from(new Set(filtered.map(row => row.date))).sort()
    });

    // Apply date range filter
    const { start, end } = getDateRange(timeRange, latestDate);
    filtered = filtered.filter(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      rowDate.setHours(0, 0, 0, 0);
      
      const startTime = start.getTime();
      const endTime = end.getTime();
      const rowTime = rowDate.getTime();
      
      return rowTime >= startTime && rowTime <= endTime;
    });

    // Debug after date filter
    console.log('After date filter:', {
      afterFilter: filtered.length,
      remainingRows: filtered.map(row => ({
        date: row.date,
        mediaBuyer: row.mediaBuyer,
        profit: row.profit
      }))
    });

    // Apply media buyer filter
    if (filters.mediaBuyer !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(row => row.mediaBuyer === filters.mediaBuyer);
      console.log('After media buyer filter:', {
        buyer: filters.mediaBuyer,
        beforeCount,
        afterCount: filtered.length,
        remainingRows: filtered.map(row => ({
          date: row.date,
          mediaBuyer: row.mediaBuyer,
          profit: row.profit
        }))
      });
    }

    // Apply remaining filters...
    if (filters.adAccount !== 'all') {
      filtered = filtered.filter(row => row.adAccount === filters.adAccount);
    }
    if (filters.offer !== 'all') {
      filtered = filtered.filter(row => row.offer === filters.offer);
    }
    if (filters.network !== 'all') {
      filtered = filtered.filter(row => row.network === filters.network);
    }

    return filtered;
  }, [data.tableData, timeRange, latestDate, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      // Default sort by date descending, then by profit descending
      return [...filteredData].sort((a, b) => {
        // First sort by date
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        const dateA = new Date(aYear, aMonth - 1, aDay);
        const dateB = new Date(bYear, bMonth - 1, bDay);
        
        const dateCompare = dateB.getTime() - dateA.getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // Then by profit
        return b.profit - a.profit;
      });
    }

    return [...filteredData].sort((a: any, b: any) => {
      if (sortConfig.key === 'date') {
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        const dateA = new Date(aYear, aMonth - 1, aDay);
        const dateB = new Date(bYear, bMonth - 1, bDay);
        return sortConfig.direction === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Add debug logging after sorting
  console.log('Sorted data:', {
    totalRows: sortedData.length,
    firstFewRows: sortedData.slice(0, 5).map(row => ({
      date: row.date,
      mediaBuyer: row.mediaBuyer,
      profit: row.profit
    }))
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    const csv = Papa.unparse(sortedData.map(row => ({
      Date: row.date,
      'Media Buyer': row.mediaBuyer,
      'Ad Account': row.adAccount,
      Offer: row.offer,
      Network: row.network,
      Spend: row.adSpend,
      Revenue: row.adRev,
      Profit: row.profit
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'media_buyers_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // First, let's format the date to string
  const formatDate = (date: Date): string => {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <CardTitle>Raw Data</CardTitle>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="14d">Last 14 Days</SelectItem>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="60d">Last 60 Days</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
        <FilterControls 
          data={data.tableData}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          showMediaBuyerFilter={buyer === 'all'}
        />
        <Select 
          value={formatDate(latestDate)} 
          onValueChange={(value) => {}}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={formatDate(latestDate)}>Latest Date</SelectItem>
            {Array.from(new Set(data.tableData.map(row => row.date)))
              .filter(Boolean)  // Filter out any undefined/null values
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())  // Sort dates descending
              .map(date => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                  Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('mediaBuyer')}>
                  Media Buyer {sortConfig?.key === 'mediaBuyer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('adAccount')}>
                  Ad Account {sortConfig?.key === 'adAccount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('offer')}>
                  Offer {sortConfig?.key === 'offer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('network')}>
                  Network {sortConfig?.key === 'network' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('adSpend')}>
                  Spend {sortConfig?.key === 'adSpend' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('adRev')}>
                  Revenue {sortConfig?.key === 'adRev' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('profit')}>
                  Profit {sortConfig?.key === 'profit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('roi')}>
                  ROI {sortConfig?.key === 'roi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, idx) => {
                // Calculate ROI
                const roi = row.adSpend > 0 ? ((row.profit / row.adSpend) * 100).toFixed(1) + '%' : 'N/A';

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      {row.date}
                    </TableCell>
                    <TableCell>{row.mediaBuyer}</TableCell>
                    <TableCell>{row.adAccount}</TableCell>
                    <TableCell>{row.offer}</TableCell>
                    <TableCell>{row.network}</TableCell>
                    <TableCell className="text-right">{formatDollar(row.adSpend)}</TableCell>
                    <TableCell className="text-right">{formatDollar(row.adRev)}</TableCell>
                    <TableCell className="text-right">{formatDollar(row.profit)}</TableCell>
                    <TableCell className="text-right">{roi}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};