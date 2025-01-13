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

type TimeRange = 'yesterday' | '7d' | '14d' | 'mtd' | '30d' | '60d' | 'lastMonth' | 'ytd' | 'custom';

const DEFAULT_DATE_STRING = '2025-01-08';

const getLatestDate = (data: any[]): Date => {
  const dates = data
    .map(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      return new Date(year, month - 1, day);
    })
    .filter(date => !isNaN(date.getTime()));
  
  return new Date(Math.max(...dates.map(d => d.getTime())));
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
  // Format yesterday's date
  const yesterday = new Date(latestDate);
  yesterday.setDate(latestDate.getDate() - 1);
  const yesterdayFormatted = `${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getDate().toString().padStart(2, '0')}/${yesterday.getFullYear()}`;

  return (
    <div className="flex items-center gap-4">
      <select 
        className="border rounded p-1"
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
      >
        <option value="yesterday">Yesterday ({yesterdayFormatted})</option>
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

  const getDateRange = (timeRange: TimeRange, latestDate: Date, customDateString?: string): { start: Date, end: Date } => {
    let end = latestDate;
    let start: Date;

    switch (timeRange) {
      case 'yesterday':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 1);
        return { start, end: start };
      case '7d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 6);
        return { start, end };
      case '14d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 13);
        return { start, end };
      case 'mtd':
        start = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        return { start, end };
      case '30d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 29);
        return { start, end };
      case '60d':
        start = new Date(latestDate);
        start.setDate(latestDate.getDate() - 59);
        return { start, end };
      case 'lastMonth':
        start = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
        end = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
        return { start, end };
      case 'ytd':
        start = new Date(latestDate.getFullYear(), 0, 1);
        return { start, end };
      case 'custom':
        if (!customDateString) return { start: end, end };
        const [year, month, day] = customDateString.split('-').map(Number);
        start = new Date(year, month - 1, day);
        return { start, end: start };
      default:
        return { start: end, end };
    }
  };

  const filteredData = useMemo(() => {
    let filtered = [...data.tableData];
    
    filtered = filtered.filter(row => {
      if (typeof row.date !== 'string') return false;
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      const { start, end } = getDateRange(timeRange, latestDate, customDateString);
      return rowDate >= start && rowDate <= end;
    });

    if (buyer !== 'all') {
      filtered = filtered.filter(row => row.mediaBuyer === buyer);
    }

    filtered = filtered.filter(row => {
      if (typeof row.date !== 'string') return false;
      
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      
      switch (timeRange) {
        case 'yesterday':
          // Show latest date's data
          return rowDate.getTime() === latestDate.getTime();
        case '7d': {
          // Show last 7 days from latest date
          const sevenDaysAgo = new Date(latestDate);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
          return rowDate >= sevenDaysAgo && rowDate <= latestDate;
        }
        case 'mtd': {
          // Show current month up to latest date
          const startOfMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
          return rowDate >= startOfMonth && rowDate <= latestDate;
        }
        case 'custom': {
          const [customYear, customMonth, customDay] = customDateString.split('-').map(Number);
          const customDate = new Date(customYear, customMonth - 1, customDay);
          return rowDate.getTime() === customDate.getTime();
        }
        default:
          return true;
      }
    });

    if (offer !== 'all') filtered = filtered.filter(row => row.offer === offer);
    if (network !== 'all') filtered = filtered.filter(row => row.network === network);

    return filtered;
  }, [data.tableData, buyer, offer, network, timeRange, customDateString, latestDate]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

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
        <DateRangeSelector 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customDateString={customDateString}
          setCustomDateString={setCustomDateString}
          latestDate={latestDate}
        />
        <FilterControls 
          data={data.tableData}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
          showMediaBuyerFilter={buyer === 'all'}
        />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, idx) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};