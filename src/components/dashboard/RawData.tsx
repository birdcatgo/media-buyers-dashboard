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

type TimeRange = 'eod' | '7d' | 'mtd' | 'custom';

const DEFAULT_DATE_STRING = '2025-01-08';

const DateRangeSelector = ({ 
  timeRange, 
  setTimeRange,
  customDateString,
  setCustomDateString
}: { 
  timeRange: TimeRange;
  setTimeRange: (value: TimeRange) => void;
  customDateString: string;
  setCustomDateString: (date: string) => void;
}) => (
  <div className="flex items-center gap-4">
    <select 
      className="border rounded p-1"
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
    >
      <option value="eod">EOD Report (Jan 8)</option>
      <option value="7d">Last 7 Days (Jan 1-8)</option>
      <option value="mtd">Month to Date (January)</option>
      <option value="custom">Custom Date</option>
    </select>
    
    {timeRange === 'custom' && (
      <input
        type="date"
        className="border rounded p-1"
        value={customDateString}
        min="2025-01-01"
        max="2025-01-08"
        onChange={(e) => setCustomDateString(e.target.value)}
      />
    )}
  </div>
);

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
  const [timeRange, setTimeRange] = useState<TimeRange>('eod');
  const [customDateString, setCustomDateString] = useState(DEFAULT_DATE_STRING);
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

  const getFilteredData = (data: any[], timeRange: TimeRange) => {
    return data.filter(row => {
      if (typeof row.date !== 'string') return false;
      
      switch (timeRange) {
        case 'eod':
          return row.date === '07/01/2025';
        case '7d': {
          const [mm, dd, yyyy] = row.date.split('/').map(Number);
          const rowDate = new Date(yyyy, mm - 1, dd);
          const endDate = new Date('2025-01-07');
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 7);
          return rowDate >= startDate && rowDate <= endDate;
        }
        case 'mtd': {
          const [mm, dd, yyyy] = row.date.split('/').map(Number);
          const rowDate = new Date(yyyy, mm - 1, dd);
          const endDate = new Date('2025-01-07');
          const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          return rowDate >= startDate && rowDate <= endDate;
        }
        default:
          return true;
      }
    });
  };

  const filteredData = useMemo(() => {
    let filtered = [...data.tableData].map(normalizeNetworkOffer);

    // Always filter by buyer if it's not 'all'
    if (buyer !== 'all') {
      filtered = filtered.filter(row => row.mediaBuyer === buyer);
    }

    // Filter by date range
    filtered = filtered.filter(row => {
      if (typeof row.date !== 'string') return false;
      
      // Parse date assuming MM/DD/YYYY format
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      
      switch (timeRange) {
        case 'eod':
          // Show January 8th data
          return month === 1 && day === 8 && year === 2025;
        case '7d':
          // Show January 1st through 8th
          return month === 1 && year === 2025 && day >= 1 && day <= 8;
        case 'mtd':
          // Show all of January
          return month === 1 && year === 2025;
        case 'custom':
          // Convert custom date to match our format
          const [customYear, customMonth, customDay] = customDateString.split('-').map(Number);
          return month === customMonth && day === customDay && year === customYear;
        default:
          return true;
      }
    });

    // Apply other filters
    if (offer !== 'all') {
      filtered = filtered.filter(row => row.offer === offer);
    }
    if (network !== 'all') {
      filtered = filtered.filter(row => row.network === network);
    }

    return filtered;
  }, [data.tableData, buyer, offer, network, timeRange, customDateString]);

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
                    {typeof row.date === 'string' ? row.date : row.date.toLocaleDateString()}
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