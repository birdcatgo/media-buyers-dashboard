import { TableData } from '../types/dashboard';

interface DebugDataProps {
  data: TableData[];
  label: string;
  children?: React.ReactNode;
}

export const DebugData: React.FC<DebugDataProps> = ({ data, label, children }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Debug ${label}:`, {
      length: data?.length || 0,
      firstRow: data?.[0],
      dateType: data?.[0]?.date ? typeof data[0].date : 'no data',
      isDate: data?.[0]?.date ? (data[0].date as any) instanceof Date : false,
      sample: data?.slice(0, 3)
    });
  }
  return <>{children}</>;
}; 