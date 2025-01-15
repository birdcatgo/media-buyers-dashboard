import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { formatDollar } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HighlightItem {
  type: 'performing' | 'potential' | 'declining-profitable' | 'declining-critical' | 'inconsistent';
  title: string;
  description: string;
  metrics: {
    label: string;
    value: string;
    trend?: 'up' | 'down';
  }[];
  weekData: {
    date: string;
    profit: number;
    adSpend: number;
    adRev: number;
  }[];
}

const HighlightCard = ({ item, weekData }: { 
  item: HighlightItem; 
  weekData: {
      adSpend(adSpend: any): unknown; date: string; profit: number; roi: number; 
}[];
}) => {
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
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
          </div>
          <button 
            onClick={() => setShowChart(!showChart)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            {showChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
        <div className="flex flex-wrap gap-4">
          {item.metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">{metric.label}:</span>
              <span className="text-sm font-bold text-gray-900">{metric.value}</span>
              {metric.trend && (
                <span className={metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {metric.trend === 'up' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Chart Section - Now shown for all types */}
        {showChart && weekData.length > 0 && (
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
                  data={weekData.map(d => {
                    const profit = Number(d.profit) || 0;
                    const adSpend = Number(d.adSpend) || 0;
                    const roi = adSpend > 0 ? Number((profit / adSpend) * 100) : 0;
                    
                    return {
                      date: d.date,
                      profit,
                      roi
                    };
                  })}
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
                    domain={metric === 'roi' ? [-100, 100] : ['auto', 'auto']}
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

const calculateMetrics = (rows: any[]) => {
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

const generateHighlightsFromGroups = (groups: Map<string, any>): HighlightItem[] => {
  const highlights: HighlightItem[] = [];

  groups.forEach((group, key) => {
    // Convert weekData object to array if it's not already
    const weekDataArray = Array.isArray(group.weekData) 
      ? group.weekData 
      : Object.values(group.weekData);

    const weekMetrics = calculateMetrics(group.yesterdayData);
    const yesterdayMetrics = calculateMetrics(group.yesterdayData);
    const avgDailyProfit = weekMetrics.profit / 7;
    const yesterdayProfit = yesterdayMetrics.profit;
    const profitChange = yesterdayProfit - avgDailyProfit;
    const yesterdayRoi = yesterdayMetrics.roi;
    const avgRoi = weekMetrics.roi;
    const hasActivity = yesterdayMetrics.spend > 0;

    // High Performing (Consistently profitable with good ROI)
    if (yesterdayProfit > 1000 && avgDailyProfit > 800 && yesterdayRoi > 30) {
      highlights.push({
        type: 'performing',
        title: `Scale Opportunity: ${key}`,
        description: 'Consistently profitable with strong ROI.',
        metrics: [
          { label: 'Daily Profit', value: formatDollar(yesterdayProfit), trend: 'up' },
          { label: 'Avg Profit', value: formatDollar(avgDailyProfit) },
          { label: 'ROI', value: `${yesterdayRoi.toFixed(1)}%` }
        ],
        weekData: group.weekData
      });
    }
    // Showing Potential (Improving profit trend)
    else if (profitChange > 200 && yesterdayProfit > 500 && yesterdayRoi > 20) {
      highlights.push({
        type: 'potential',
        title: `Growing Profit: ${key}`,
        description: 'Profit is trending upward with healthy ROI.',
        metrics: [
          { label: 'Daily Profit', value: formatDollar(yesterdayProfit), trend: 'up' },
          { label: 'Profit Change', value: formatDollar(profitChange) },
          { label: 'ROI', value: `${yesterdayRoi.toFixed(1)}%` }
        ],
        weekData: group.weekData
      });
    }
    // Profitable but Declining
    else if (yesterdayProfit > 300 && profitChange < -200) {
      highlights.push({
        type: 'declining-profitable',
        title: `Monitor: ${key}`,
        description: 'Still profitable but showing decline in performance.',
        metrics: [
          { label: 'Daily Profit', value: formatDollar(yesterdayProfit), trend: 'down' },
          { label: 'vs Avg', value: formatDollar(profitChange) },
          { label: 'ROI', value: `${yesterdayRoi.toFixed(1)}%` }
        ],
        weekData: group.weekData
      });
    }
    // Critical (Losing money or severe decline)
    else if (yesterdayProfit < 0 || (yesterdayMetrics.spend > 500 && yesterdayRoi < 0)) {
      highlights.push({
        type: 'declining-critical',
        title: `Urgent Action: ${key}`,
        description: 'Currently unprofitable or severe performance decline.',
        metrics: [
          { label: 'Daily Loss', value: formatDollar(yesterdayProfit), trend: 'down' },
          { label: 'Spend', value: formatDollar(yesterdayMetrics.spend) },
          { label: 'ROI', value: `${yesterdayRoi.toFixed(1)}%` }
        ],
        weekData: group.weekData
      });
    }
    // Inconsistent (Variable profit)
    else if (hasActivity) {
      const profitVariance = Math.sqrt(
        weekDataArray
          .map((d: any) => d.profit)
          .reduce((acc: number, profit: number) => 
            acc + Math.pow(profit - avgDailyProfit, 2), 0) / 
        weekDataArray.length
      );

      highlights.push({
        type: 'inconsistent',
        title: `Variable: ${key}`,
        description: 'Inconsistent daily profit performance.',
        metrics: [
          { label: 'Current Profit', value: formatDollar(yesterdayProfit) },
          { label: 'Avg Profit', value: formatDollar(avgDailyProfit) },
          { label: 'Daily Variance', value: `±${formatDollar(profitVariance)}` }
        ],
        weekData: weekDataArray // Use the array version
      });
    }
  });

  return highlights;
};

// Helper function to convert weekData to array format
const formatWeekData = (weekData: any) => {
  if (!weekData) return [];
  if (Array.isArray(weekData)) return weekData;
  return Object.values(weekData);
};

export const HighlightsDashboard = ({
  data
}: {
  data: DashboardData;
}) => {
  const { offerHighlights, buyerHighlights } = useMemo(() => {
    // Find the latest date in the data
    const latestDate = new Date(Math.max(...data.tableData.map(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      return new Date(year, month - 1, day).getTime();
    })));

    // Generate the last 7 days (including latest date)
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(latestDate);
      date.setDate(latestDate.getDate() - i);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    }).reverse(); // Reverse to get chronological order

    const targetDate = weekDates[weekDates.length - 1]; // Latest date

    // Generate offer-level highlights
    const offerGroups = new Map();
    const buyerGroups = new Map();

    // First pass: group by offers (combining all buyers)
    data.tableData.forEach(row => {
      const isTargetDate = row.date === targetDate;
      const isInWeek = weekDates.includes(row.date);

      // Create keys that include media buyer
      const offerKey = (row.network === 'Suited' && row.offer === 'ACA') 
        ? `${row.mediaBuyer}-ACA-ACA` 
        : `${row.mediaBuyer}-${row.network}-${row.offer}`;

      if (isTargetDate || isInWeek) {
        // Handle offer grouping with media buyer context
        if (!offerGroups.has(offerKey)) {
          offerGroups.set(offerKey, {
            mediaBuyer: row.mediaBuyer,
            network: row.network,
            offer: row.offer,
            weekData: {},
            yesterdayData: []
          });
        }
        
        const offerGroup = offerGroups.get(offerKey);
        
        if (isTargetDate) {
          offerGroup.yesterdayData.push(row);
        }
        
        if (isInWeek) {
          if (!offerGroup.weekData[row.date]) {
            offerGroup.weekData[row.date] = {
              date: row.date,
              profit: 0,
              adSpend: 0,
              adRev: 0
            };
          }
          offerGroup.weekData[row.date].profit += (row.profit || 0);
          offerGroup.weekData[row.date].adSpend += (row.adSpend || 0);
          offerGroup.weekData[row.date].adRev += (row.adRev || 0);
        }
      }

      // Update buyer grouping to include offer info
      const buyerKey = `${row.mediaBuyer}-${row.network}-${row.offer}`;
      if (!buyerGroups.has(buyerKey)) {
        buyerGroups.set(buyerKey, {
          mediaBuyer: row.mediaBuyer,
          network: row.network,
          offer: row.offer,
          adAccount: row.adAccount,
          weekData: {},
          yesterdayData: []
        });
      }
      
      const buyerGroup = buyerGroups.get(buyerKey);
      if (isTargetDate) buyerGroup.yesterdayData.push(row);
      
      if (isInWeek) {
        // Aggregate by date for each buyer's offer
        if (!buyerGroup.weekData[row.date]) {
          buyerGroup.weekData[row.date] = {
            date: row.date,
            profit: 0,
            adSpend: 0,
            adRev: 0
          };
        }
        buyerGroup.weekData[row.date].profit += (row.profit || 0);
        buyerGroup.weekData[row.date].adSpend += (row.adSpend || 0);
        buyerGroup.weekData[row.date].adRev += (row.adRev || 0);
      }
    });

    // Before returning, convert weekData objects to arrays
    buyerGroups.forEach(group => {
      group.weekData = Object.values(group.weekData) as { date: string; profit: number; adSpend: number; adRev: number; }[];
      group.weekData.sort((a: { date: string; profit: number; adSpend: number; adRev: number }, 
                        b: { date: string; profit: number; adSpend: number; adRev: number }) => {
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        return new Date(aYear, aMonth - 1, aDay).getTime() - 
               new Date(bYear, bMonth - 1, bDay).getTime();
      });
    });

    return {
      offerHighlights: generateHighlightsFromGroups(offerGroups),
      buyerHighlights: Array.from(buyerGroups.values()).reduce((acc, group) => {
        const buyerName = group.mediaBuyer;
        if (!acc[buyerName]) acc[buyerName] = [];
        
        const highlights = generateHighlightsFromGroups(new Map([[
          `${group.mediaBuyer}-${group.network}-${group.offer}`,
          {
            ...group,
            title: `${group.network} - ${group.offer}` // Keep title format consistent
          }
        ]]));
        
        if (highlights.length > 0) {
          acc[buyerName].push(...highlights.map(h => ({
            ...h,
            mediaBuyer: group.mediaBuyer,
            adAccount: group.adAccount
          })));
        }
        
        return acc;
      }, {} as Record<string, HighlightItem[]>)
    };
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Offer Performance Highlights Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Offer Performance Highlights</h2>
        
        {offerHighlights.some(h => h.type === 'performing') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-green-700">Performing Well</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerHighlights.filter(h => h.type === 'performing').map((highlight, idx) => (
                <HighlightCard 
                  key={idx} 
                  item={highlight} 
                  weekData={formatWeekData(highlight.weekData)}
                />
              ))}
            </div>
          </div>
        )}

        {offerHighlights.some(h => h.type === 'potential') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-700">Showing Potential</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerHighlights.filter(h => h.type === 'potential').map((highlight, idx) => (
                <HighlightCard 
                  key={idx} 
                  item={highlight} 
                  weekData={formatWeekData(highlight.weekData)}
                />
              ))}
            </div>
          </div>
        )}

        {offerHighlights.some(h => h.type === 'declining-profitable') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-700">Monitor Performance</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerHighlights
                .filter(h => h.type === 'declining-profitable')
                .map((highlight, idx) => (
                  <HighlightCard key={idx} item={highlight} weekData={formatWeekData(highlight.weekData)} />
                ))}
            </div>
          </div>
        )}

        {offerHighlights.some(h => h.type === 'declining-critical') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-red-700">Critical Attention Needed</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerHighlights
                .filter(h => h.type === 'declining-critical')
                .map((highlight, idx) => (
                  <HighlightCard key={idx} item={highlight} weekData={formatWeekData(highlight.weekData)} />
                ))}
            </div>
          </div>
        )}

        {offerHighlights.some(h => h.type === 'inconsistent') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-orange-700">Inconsistent Performance</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offerHighlights.filter(h => h.type === 'inconsistent').map((highlight, idx) => (
                <HighlightCard 
                  key={idx} 
                  item={highlight} 
                  weekData={formatWeekData(highlight.weekData)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 