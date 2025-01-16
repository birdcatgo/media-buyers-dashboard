export interface TableData {
  date: string;
  mediaBuyer: string;
  network: string;
  offer: string;
  adAccount: string;
  adSpend: number;
  adRev: number;
  profit: number;
}

export interface DashboardData {
  dailyData: TableData[];
  offerData: TableData[];
  networkData: TableData[];
  tableData: TableData[];
  overviewData?: any[];
}

export interface WeekDataPoint {
  date: string;
  profit: number;
  adSpend: number;
  adRev: number;
}

export interface HighlightItem {
  type: 'performing' | 'potential' | 'declining-profitable' | 'declining-critical' | 'inconsistent';
  title: string;
  description?: string;
  metrics: {
    spend: number;
    revenue: number;
    profit: number;
    roi: number;
  };
  status: {
    icon: string;
    color: string;
    label: string;
  };
  trend: {
    icon: string;
    color: string;
    value: number;
  };
  weekData?: WeekDataPoint[];
}