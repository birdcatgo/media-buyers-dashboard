import React from 'react';
import { TableData } from '../types/dashboard';
import { RawData } from './RawData';
import { DataDebugger } from '../components/DataDebugger';

interface DashboardProps {
  data: TableData[];
  viewMode: 'yesterday' | 'mtd' | 'custom';
}

export const Dashboard: React.FC<DashboardProps> = ({ data, viewMode }) => {
  // Ensure data is an array and dates are strings
  const safeData = React.useMemo(() => {
    return (data || []).map(row => ({
      ...row,
      date: String(row.date)
    }));
  }, [data]);

  const tabs = [
    { id: 'eod', label: 'EOD Report' },
    { id: '7d', label: '7 Days' },
    { id: 'mtd', label: 'MTD' },
    { id: 'all', label: 'All Time' }
  ];

  return (
    <DataDebugger data={safeData} componentName="Dashboard">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Raw Data</h2>
          <RawData data={safeData} />
        </div>
      </div>
    </DataDebugger>
  );
}; 