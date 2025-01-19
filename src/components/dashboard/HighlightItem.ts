export interface HighlightItem {
  title: string;
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
} 