import React from 'react';
import { TableData } from '../types/dashboard';

interface DataDebuggerProps {
  data: TableData[];
  componentName: string;
  children: React.ReactNode;
}

export const DataDebugger = ({ data, componentName, children }: DataDebuggerProps) => {
  React.useEffect(() => {
    console.log(`${componentName} Data:`, {
      timestamp: new Date().toISOString(),
      dataLength: data?.length,
      isArray: Array.isArray(data),
      firstRow: data?.[0],
      firstRowDate: data?.[0]?.date 
        ? (typeof data[0].date === 'string' 
            ? data[0].date 
            : (Object.prototype.toString.call(data[0].date) === '[object Date]' && !isNaN((data[0].date as Date).getTime())) 
              ? (data[0].date as Date).toLocaleDateString() 
              : 'invalid date')
        : 'no date',
      firstRowDateType: data?.[0]?.date ? typeof data[0].date : 'no data',
      stack: new Error().stack
    });
  }, [data, componentName]);

  return children;
}; 