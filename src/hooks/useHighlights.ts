import { useMemo } from 'react';
import { DashboardData, TableData, HighlightItem } from '@/types/dashboard';
import { calculateMetrics } from '@/utils/highlightUtils';
import { getROIStatus, getTrendIcon, getTrendColor } from '@/utils/statusIndicators';
import { getTrendIndicator } from '@/utils/trendIndicators';

type Trend = {
  type: string;
  icon: string;
  label: string;
};

interface Highlight {
  title: string;
  value: number;
  trend: Trend;
}

export const useHighlights = (data: DashboardData) => {
  const tableData = Array.isArray(data.tableData) ? data.tableData : [];
  
  const { buyerHighlights } = useMemo(() => {
    const buyerHighlights: Record<string, HighlightItem[]> = {};

    tableData.forEach(row => {
      const buyer = row.mediaBuyer;
      if (!buyerHighlights[buyer]) {
        buyerHighlights[buyer] = [];
      }

      // Calculate metrics
      const metrics = calculateMetrics(row);
      const roi = metrics.spend > 0 ? (metrics.profit / metrics.spend) * 100 : 0;
      
      // Get status using shared utility
      const status = getROIStatus(roi, metrics.spend);
      
      // Calculate trend
      const trendObj = getTrendIndicator(metrics.profit, metrics.previousProfit);

      // Create highlight item
      const highlight: HighlightItem = {
        type: 'performing',
        title: `${row.network} - ${row.offer}`,
        metrics: {
          spend: metrics.spend,
          revenue: metrics.revenue,
          profit: metrics.profit,
          roi: roi
        },
        status: {
          icon: status.icon,
          color: status.color,
          label: status.label
        },
        trend: {
          icon: getTrendIcon(trendObj),
          color: getTrendColor(trendObj),
          value: metrics.profit - metrics.previousProfit
        }
      };

      buyerHighlights[buyer].push(highlight);
    });

    // Sort highlights by profit
    Object.keys(buyerHighlights).forEach(buyer => {
      buyerHighlights[buyer].sort((a, b) => b.metrics.profit - a.metrics.profit);
    });

    return { buyerHighlights };
  }, [tableData]);

  return { buyerHighlights };
}; 