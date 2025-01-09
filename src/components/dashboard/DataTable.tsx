// src/components/dashboard/DataTable.tsx

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TableData } from '@/types/dashboard';
import { useDashboardState } from '@/hooks/useDashboardState';
type DateRange = 'yesterday' | 'mtd' | '7d' | 'all';

interface DataTableProps {
  data: TableData[];
  userRole: 'admin' | 'media_buyer' | 'viewer';
  selectedBuyer: string;
  onBuyerChange: (buyer: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'mediaBuyer', label: 'Media Buyer' },
  { key: 'network', label: 'Network' },
  { key: 'offer', label: 'Offer' },
  { key: 'adAccount', label: 'Ad Account' },
  { key: 'adRev', label: 'Ad Rev' },
  { key: 'adSpend', label: 'Ad Spend' },
  { key: 'profit', label: 'Profit' }
];

const DataTable = ({
  data,
  userRole,
  selectedBuyer,
  onBuyerChange,
  dateRange,
  onDateRangeChange
}: DataTableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TableData;
    direction: 'asc' | 'desc';
  } | null>(null);

  const mediaBuyers = ['All', 'Dave', 'Mike', 'Zel', 'Asheesh', 'Daniel', 'Merry'];

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof TableData) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Campaign Details</CardTitle>
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={onDateRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            {userRole === 'admin' && (
              <Select value={selectedBuyer} onValueChange={onBuyerChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select buyer" />
                </SelectTrigger>
                <SelectContent>
                  {mediaBuyers.map(buyer => (
                    <SelectItem key={buyer} value={buyer.toLowerCase()}>
                      {buyer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column =>
                  userRole === 'admin' || column.key !== 'mediaBuyer' ? (
                    <TableHead
                      key={column.key}
                      onClick={() => requestSort(column.key as keyof TableData)}
                      className="cursor-pointer"
                    >
                      {column.label}
                      {sortConfig?.key === column.key && (
                        <span>
                          {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                        </span>
                      )}
                    </TableHead>
                  ) : null
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {row.date}
                  </TableCell>
                  {userRole === 'admin' && (
                    <TableCell>{row.mediaBuyer}</TableCell>
                  )}
                  <TableCell>{row.network}</TableCell>
                  <TableCell>{row.offer}</TableCell>
                  <TableCell>{row.adAccount}</TableCell>
                  <TableCell className="text-right">
                    ${row.adRev.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${row.adSpend.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ${row.profit.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;
