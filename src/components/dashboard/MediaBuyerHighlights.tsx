import React from 'react';
import { HighlightCard, HighlightItem } from '@/components/dashboard/HighlightCard';
import { formatWeekData } from '@/utils/highlightUtils';

export const MediaBuyerHighlights = ({
  highlights
}: {
  highlights: HighlightItem[];
}) => {
  return (
    <div className="space-y-8">
      {highlights.some(h => h.type === 'performing') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-green-700">Performing Well</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights
              .filter(h => h.type === 'performing')
              .map((highlight, idx) => (
                <HighlightCard key={idx} item={highlight} weekData={formatWeekData(highlight.weekData)} />
              ))}
          </div>
        </div>
      )}

      {/* Add other sections similar to HighlightsDashboard */}
    </div>
  );
}; 