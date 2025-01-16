import React, { useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HighlightItem, WeekDataPoint } from "../../types/dashboard";

export const HighlightCard = ({ item }: { item: HighlightItem }) => {
  const [showChart, setShowChart] = useState(true);
  const [metric, setMetric] = useState<'profit' | 'roi'>('profit');

  const bgColor = {
    performing: 'bg-green-50 border-green-200',
    potential: 'bg-blue-50 border-blue-200',
    'declining-profitable': 'bg-yellow-50 border-yellow-200',
    'declining-critical': 'bg-red-50 border-red-200',
    inconsistent: 'bg-orange-50 border-orange-200'
  }[item.type];

  const chartColor = {
    performing: '#16a34a',
    potential: '#2563eb',
    'declining-profitable': '#eab308',
    'declining-critical': '#ef4444',
    inconsistent: '#f97316'
  }[item.type];

  const iconColor = {
    performing: 'text-green-600',
    potential: 'text-blue-600',
    'declining-profitable': 'text-yellow-600',
    'declining-critical': 'text-red-600',
    inconsistent: 'text-orange-600'
  }[item.type];

  const Icon = {
    performing: TrendingUp,
    potential: AlertTriangle,
    'declining-profitable': TrendingDown,
    'declining-critical': TrendingDown,
    inconsistent: AlertTriangle
  }[item.type];

  return (
    <Card className={bgColor}>
      <CardContent className="pt-6">
        {/* Copy the entire JSX from HighlightsDashboard's HighlightCard */}

        {showChart && (item.weekData?.length ?? 0) > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">7 Day Trend</h4>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as 'profit' | 'roi')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="profit">Profit</option>
                <option value="roi">ROI</option>
              </select>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={item.weekData ?? []}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  {/* ... rest of chart components ... */}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 