export const formatWeekData = (weekData: any) => {
  if (!weekData) return [];
  if (Array.isArray(weekData)) return weekData;
  return Object.values(weekData);
};

export const calculateMetrics = (rows: any[]) => {
  if (!rows || !rows.length) return { profit: 0, spend: 0, revenue: 0, roas: 0, roi: 0 };
  
  const metrics = rows.reduce((acc, row) => ({
    profit: acc.profit + (row.profit || 0),
    spend: acc.spend + (row.adSpend || 0),
    revenue: acc.revenue + (row.adRev || 0)
  }), { profit: 0, spend: 0, revenue: 0 });

  const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
  const roi = metrics.spend > 0 ? (metrics.profit / metrics.spend) * 100 : 0;
  return { ...metrics, roas, roi };
}; 