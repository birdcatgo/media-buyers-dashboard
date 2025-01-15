export const formatWeekData = (weekData: any) => {
  if (!weekData) return [];
  if (Array.isArray(weekData)) return weekData;
  return Object.values(weekData);
};

interface RowData {
  date: string;
  mediaBuyer: string;
  network: string;
  offer: string;
  adAccount: string;
  adSpend: number;
  adRev: number;
  profit: number;
}

export const calculateMetrics = (row: RowData) => {
  return {
    spend: row.adSpend,
    revenue: row.adRev,
    profit: row.profit,
    previousProfit: 0 // Add if needed
  };
}; 