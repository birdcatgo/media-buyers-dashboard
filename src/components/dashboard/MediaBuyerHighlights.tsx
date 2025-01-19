import React from 'react';
import HighlightCard from '@/components/dashboard/HighlightCard';
import { HighlightItem, WeekDataPoint } from '@/types/dashboard';

export const MediaBuyerHighlights = ({
  highlights
}: {
  highlights: HighlightItem[];
}) => {
  // Helper function to ensure weekData is in the correct format
  const formatWeekData = (data?: WeekDataPoint[]): WeekDataPoint[] => {
    if (!data) return [];
    return data;
  };

  return (
    <div className="space-y-8">
      {highlights.some(h => h.type === 'performing') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-green-700">Performing Well</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights
              .filter(h => h.type === 'performing')
              .map((highlight, idx) => (
                <HighlightCard
                  key={idx}
                  item={{
                    ...highlight,
                    description: highlight.description || '',
                    weekData: formatWeekData(highlight.weekData)
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {highlights.some(h => h.type === 'potential') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">Showing Potential</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights
              .filter(h => h.type === 'potential')
              .map((highlight, idx) => (
                <HighlightCard
                  key={idx}
                  item={{
                    ...highlight,
                    description: highlight.description || '',
                    weekData: formatWeekData(highlight.weekData)
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {highlights.some(h => h.type === 'declining-profitable') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-700">Monitor Performance</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights
              .filter(h => h.type === 'declining-profitable')
              .map((highlight, idx) => (
                <HighlightCard
                  key={idx}
                  item={{
                    ...highlight,
                    description: highlight.description || '',
                    weekData: formatWeekData(highlight.weekData)
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {highlights.some(h => h.type === 'declining-critical') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-red-700">Critical Attention Needed</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights
              .filter(h => h.type === 'declining-critical')
              .map((highlight, idx) => (
                <HighlightCard
                  key={idx}
                  item={{
                    ...highlight,
                    description: highlight.description || '',
                    weekData: formatWeekData(highlight.weekData)
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {highlights.some(h => h.type === 'inconsistent') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-orange-700">Inconsistent Performance</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights
              .filter(h => h.type === 'inconsistent')
              .map((highlight, idx) => (
                <HighlightCard
                  key={idx}
                  item={{
                    ...highlight,
                    description: highlight.description || '',
                    weekData: formatWeekData(highlight.weekData)
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};