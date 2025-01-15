import { useMemo } from 'react';
import { DashboardData } from '@/types/dashboard';
import { calculateMetrics } from '@/utils/highlightUtils';
import { HighlightItem } from '@/components/dashboard/HighlightCard';
import { getROIStatus, getTrendIcon, getTrendColor } from '@/utils/statusIndicators';

export const useHighlights = (data: DashboardData) => {
  const { buyerHighlights } = useMemo(() => {
    const buyerHighlights: Record<string, HighlightItem[]> = {};

    data.tableData.forEach(row => {
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
      const trend = metrics.previousProfit 
        ? ((metrics.profit - metrics.previousProfit) / Math.abs(metrics.previousProfit)) * 100
        : 0;

      // Create highlight item
      const highlight: HighlightItem = {
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
          icon: getTrendIcon(trend),
          color: getTrendColor(trend),
          value: trend
        }
      };

      buyerHighlights[buyer].push(highlight);
    });

    // Sort highlights by profit
    Object.keys(buyerHighlights).forEach(buyer => {
      buyerHighlights[buyer].sort((a, b) => b.metrics.profit - a.metrics.profit);
    });

    return { buyerHighlights };
  }, [data]);

  return { buyerHighlights };
}; 