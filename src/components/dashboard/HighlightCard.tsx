import React, { useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface HighlightItem {
  title: string;
  type: 'performing' | 'potential' | 'declining-profitable' | 'declining-critical' | 'inconsistent';
  description?: string;
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
  weekData?: Array<{ date: string; profit: number; }>;
}

const HighlightCard = ({ item }: { item: HighlightItem }) => {
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${iconColor}`} />
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
            </div>
            {item.description && (
              <p className="text-sm text-gray-600 ml-8">{item.description}</p>
            )}
          </div>
          <button 
            onClick={() => setShowChart(!showChart)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            {showChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Spend:</span>
            <span className="text-sm font-bold text-gray-900">
              ${item.metrics.spend.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Revenue:</span>
            <span className="text-sm font-bold text-gray-900">
              ${item.metrics.revenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Profit:</span>
            <span className="text-sm font-bold text-gray-900">
              ${item.metrics.profit.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">ROI:</span>
            <span className="text-sm font-bold text-gray-900">
              {item.metrics.roi.toFixed(1)}%
            </span>
          </div>
        </div>

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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tickFormatter={(value) => 
                      metric === 'profit'
                        ? `$${(value / 1000).toFixed(1)}k`
                        : `${value.toFixed(1)}%`
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      metric === 'profit'
                        ? `$${Number(value).toLocaleString()}`
                        : `${Number(value).toFixed(1)}%`,
                      metric === 'profit' ? 'Profit' : 'ROI'
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HighlightCard;