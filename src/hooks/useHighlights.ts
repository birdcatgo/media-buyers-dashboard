import { useMemo } from 'react';
import { DashboardData } from '@/types/dashboard';
import { calculateMetrics } from '@/utils/highlightUtils';
import { HighlightItem } from '@/components/dashboard/HighlightCard';
import { getROIStatus, getTrendIcon, getTrendColor } from '@/utils/statusIndicators';

export const useHighlights = (data: DashboardData) => {
  const { buyerHighlights } = useMemo(() => {
    // Define and generate buyerHighlights here
    const buyerHighlights: Record<string, HighlightItem[]> = {};

    // Example logic to populate buyerHighlights
    data.tableData.forEach(row => {
      const buyer = row.mediaBuyer;
      if (!buyerHighlights[buyer]) {
        buyerHighlights[buyer] = [];
      }
      // Add logic to populate highlights for each buyer
    });

    return { buyerHighlights };
  }, [data]);

  return { buyerHighlights };
};

// Update the ROI status calculation in the hook
const getHighlightStatus = (roi: number, spend: number) => {
  const status = getROIStatus(roi, spend);
  return {
    icon: status.icon,
    color: status.color,
    label: status.label
  };
};

// Update trend calculation
const getTrendIndicator = (trend: number) => ({
  icon: getTrendIcon(trend),
  color: getTrendColor(trend)
}); 