import React from 'react';
import { TableData } from '../types/dashboard';
import { ErrorBoundary } from './ErrorBoundary';
import { DebugData } from './DebugData';

interface RawDataProps {
  data: TableData[];
}

const RawDataTable = ({ data }: RawDataProps) => {
  // Validate data structure
  if (!Array.isArray(data)) {
    console.error('Invalid data structure:', data);
    return <div>Invalid data structure</div>;
  }

  const formatValue = (value: unknown): string => {
    // Handle null/undefined
    if (value == null) {
      return '';
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value.toFixed(2);
    }

    // Handle dates (should never happen, but just in case)
    if (value instanceof Date) {
      console.warn('Found Date object when string expected:', value);
      return value.toLocaleDateString('en-GB');
    }

    // Everything else to string
    return String(value);
  };

  return (
    <DebugData data={data} label="RawDataTable">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Media Buyer</th>
              <th className="px-4 py-2">Network</th>
              <th className="px-4 py-2">Offer</th>
              <th className="px-4 py-2">Ad Account</th>
              <th className="px-4 py-2">Ad Rev</th>
              <th className="px-4 py-2">Ad Spend</th>
              <th className="px-4 py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              // Type check each field
              const safeRow = {
                date: formatValue(row.date),
                mediaBuyer: formatValue(row.mediaBuyer),
                network: formatValue(row.network),
                offer: formatValue(row.offer),
                adAccount: formatValue(row.adAccount),
                adRev: formatValue(row.adRev),
                adSpend: formatValue(row.adSpend),
                profit: formatValue(row.profit)
              };

              return (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{safeRow.date}</td>
                  <td className="px-4 py-2">{safeRow.mediaBuyer}</td>
                  <td className="px-4 py-2">{safeRow.network}</td>
                  <td className="px-4 py-2">{safeRow.offer}</td>
                  <td className="px-4 py-2">{safeRow.adAccount}</td>
                  <td className="px-4 py-2">{safeRow.adRev}</td>
                  <td className="px-4 py-2">{safeRow.adSpend}</td>
                  <td className="px-4 py-2">{safeRow.profit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DebugData>
  );
};

// Wrap the component with ErrorBoundary
export const RawData = (props: RawDataProps) => (
  <ErrorBoundary>
    <RawDataTable {...props} />
  </ErrorBoundary>
); 