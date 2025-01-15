import { MediaBuyerHighlights } from './MediaBuyerHighlights';
import { useHighlights } from '@/hooks/useHighlights';
import { DashboardData } from '@/types/dashboard';

export const MediaBuyerDashboard = ({
  data,
  mediaBuyer
}: {
  data: DashboardData;
  mediaBuyer: string;
}) => {
  const { buyerHighlights } = useHighlights(data);
  const highlights = buyerHighlights[mediaBuyer] || [];

  return (
    <div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Performance Highlights</h2>
        <MediaBuyerHighlights highlights={highlights} />
      </div>
    </div>
  );
}; 