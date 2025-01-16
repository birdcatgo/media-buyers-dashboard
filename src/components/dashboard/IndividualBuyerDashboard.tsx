import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { RawData } from './RawData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDollar } from '@/utils/formatters';
import { normalizeNetworkOffer } from '@/utils/dataUtils';
import { ROIWidget } from './ROIWidget';
import { getROIStatus, getTrendIcon, getTrendColor } from '@/utils/statusIndicators';
import { getTrendIndicator } from '@/utils/trendIndicators';

// Add this helper function
const getStatusEmoji = (profit: number) => {
  if (profit > 3000) return '🟢';
  if (profit > 1000) return '🟡';
  if (profit > 0) return '🟠';
  return '🔴';
};

type TimeRange = 'yesterday' | '7d' | '14d' | 'mtd' | '30d' | '60d' | 'lastMonth' | 'ytd';

interface PerformanceData {
  name: string;
  profit: number;
  spend: number;
  revenue: number;
}

interface Props {
  buyer: string;
  data: DashboardData;
  offer?: string;
  network?: string;
}

const getTimeRangeLabel = (timeRange: TimeRange): string => {
  switch (timeRange) {
    case 'yesterday':
      return "Yesterday's";
    case '7d':
      return 'Last 7 Days';
    case '14d':
      return 'Last 14 Days';
    case 'mtd':
      return 'MTD';
    case '30d':
      return 'Last 30 Days';
    case '60d':
      return 'Last 60 Days';
    case 'lastMonth':
      return 'Last Month';
    case 'ytd':
      return 'YTD';
    default:
      return '';
  }
};

const MetricCard = ({ title, value, icon }: { 
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardContent className="flex items-center p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">${value.toLocaleString()}</h3>
      </div>
    </CardContent>
  </Card>
);

const SummaryTable = ({ data, title, timeRange }: { 
  data: any[]; 
  title: string;
  timeRange: TimeRange;
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // First, normalize the data to ensure consistent structure
  const normalizedData = (data || []).map(row => ({
    name: row.name || '',
    profit: row.profit || 0,
    spend: row.spend || 0,
    revenue: row.revenue || 0,
    previousPeriodProfit: row.previousPeriodProfit || 0,
    trend: null
  }));

  // Initialize processedData without ACA - ACA
  const processedData: Record<string, any> = {};

  // Then process the data
  normalizedData.forEach(row => {
    if (row.name === 'Suited - ACA') {
      // Create ACA - ACA entry if it doesn't exist
      if (!processedData['ACA - ACA']) {
        processedData['ACA - ACA'] = {
          name: 'ACA - ACA',
          profit: 0,
          spend: 0,
          revenue: 0,
          previousPeriodProfit: 0,
          breakdown: [],
          trend: null
        };
      }

      // Update ACA - ACA totals
      const acaEntry = processedData['ACA - ACA'];
      acaEntry.spend += row.spend;
      acaEntry.revenue += row.revenue;
      acaEntry.profit += row.profit;
      acaEntry.previousPeriodProfit += row.previousPeriodProfit;
      
      // Add to breakdown
      if (Array.isArray(acaEntry.breakdown)) {
        acaEntry.breakdown.push({
          ...row,
          trend: getTrendIndicator(row.profit, row.previousPeriodProfit)
        });
      }
    } else {
      processedData[row.name] = {
        ...row,
        trend: getTrendIndicator(row.profit, row.previousPeriodProfit)
      };
    }
  });

  // Calculate trend for ACA - ACA only if it exists and has data
  if (processedData['ACA - ACA']?.profit !== undefined) {
    processedData['ACA - ACA'].trend = getTrendIndicator(
      processedData['ACA - ACA'].profit,
      processedData['ACA - ACA'].previousPeriodProfit
    );
  }

  // Remove empty ACA - ACA entry if no data was added
  if (processedData['ACA - ACA']?.breakdown?.length === 0) {
    delete processedData['ACA - ACA'];
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 px-2 whitespace-nowrap">Name</th>
                <th className="text-right py-1.5 px-2 whitespace-nowrap">Spend</th>
                <th className="text-right py-1.5 px-2 whitespace-nowrap">Revenue</th>
                <th className="text-right py-1.5 px-2 whitespace-nowrap">Profit</th>
                <th className="text-right py-1.5 px-2 whitespace-nowrap">ROI</th>
                <th className="text-center py-1.5 px-2 whitespace-nowrap">Status</th>
                <th className="text-center py-1.5 px-2 whitespace-nowrap">Trend</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.values(processedData).map((row: any) => (
                <React.Fragment key={row.name}>
                  <tr className="border-b">
                    <td className="py-1.5 px-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {row.name === 'ACA - ACA' && row.breakdown?.length > 0 && (
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedRows);
                              if (expandedRows.has(row.name)) {
                                newExpanded.delete(row.name);
                              } else {
                                newExpanded.add(row.name);
                              }
                              setExpandedRows(newExpanded);
                            }}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                          >
                            {expandedRows.has(row.name) ? '▼' : '▶'}
                          </button>
                        )}
                        {row.name}
                      </div>
                    </td>
                    <td className="text-right py-1.5 px-2 whitespace-nowrap">{formatDollar(row.spend)}</td>
                    <td className="text-right py-1.5 px-2 whitespace-nowrap">{formatDollar(row.revenue)}</td>
                    <td className="text-right py-1.5 px-2 whitespace-nowrap">{formatDollar(row.profit)}</td>
                    <td className="text-right py-1.5 px-2 whitespace-nowrap">
                      {row.spend > 0 ? `${((row.profit / row.spend) * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="text-center py-1.5 px-2">
                      {getStatusEmoji(row.profit)}
                    </td>
                    <td className="text-center py-1.5 px-2">
                      <div className="flex items-center justify-center gap-1">
                        {row.trend ? (
                          <>
                            <span className={
                              row.trend.type === 'positive' ? 'text-green-500' :
                              row.trend.type === 'negative' ? 'text-red-500' :
                              'text-gray-500'
                            }>
                              {row.trend.icon}
                            </span>
                            <span className="text-xs text-gray-500">
                              {row.trend.label}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(row.name) && row.breakdown?.map((subRow: any) => (
                    <tr key={subRow.name} className="bg-gray-50">
                      <td className="py-1.5 px-2 pl-8 whitespace-nowrap">{subRow.name}</td>
                      <td className="text-right py-1.5 px-2 whitespace-nowrap">{formatDollar(subRow.spend)}</td>
                      <td className="text-right py-1.5 px-2 whitespace-nowrap">{formatDollar(subRow.revenue)}</td>
                      <td className="text-right py-1.5 px-2 whitespace-nowrap">{formatDollar(subRow.profit)}</td>
                      <td className="text-right py-1.5 px-2 whitespace-nowrap">
                        {subRow.spend > 0 ? `${((subRow.profit / subRow.spend) * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        {getStatusEmoji(subRow.profit)}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {subRow.trend ? (
                            <>
                              <span className={
                                subRow.trend.type === 'positive' ? 'text-green-500' :
                                subRow.trend.type === 'negative' ? 'text-red-500' :
                                'text-gray-500'
                              }>
                                {subRow.trend.icon}
                              </span>
                              <span className="text-xs text-gray-500">
                                {subRow.trend.label}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const DailyProfitChart = ({ data, timeRange }: { 
  data: any[]; 
  timeRange: TimeRange;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Daily Profit</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={(value) => formatDollar(value)}
              width={100}
            />
            <Tooltip 
              formatter={(value: number) => [formatDollar(value), 'Profit']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#22c55e" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

interface PerformanceItem {
  profit: number;
  spend: number;
  revenue: number;
  name: string;
}

// Add this helper function to find the latest date
const getLatestDate = (data: any[]): Date => {
  const dates = data
    .map(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      return new Date(year, month - 1, day);
    })
    .filter(date => !isNaN(date.getTime()));
  
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Debug log to verify latest date
  console.log('Latest date calculation:', {
    allDates: dates.map(d => d.toLocaleDateString()),
    maxDate: maxDate.toLocaleDateString()
  });
  
  return maxDate;
};

// Add this helper function after getLatestDate
const getDateRange = (timeRange: TimeRange, latestDate: Date): { start: Date, end: Date } => {
  let end = new Date(latestDate);
  let start: Date;

  switch (timeRange) {
    case 'yesterday':
      // For yesterday, we want the day before the latest date
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      
      // Debug log for yesterday dates
      console.log('Yesterday date range:', {
        latestDate: latestDate.toLocaleDateString(),
        start: start.toLocaleDateString(),
        end: end.toLocaleDateString()
      });
      
      return { start, end };
    case '7d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 6);
      return { start, end };
    case '14d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 13);
      return { start, end };
    case 'mtd':
      start = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      return { start, end };
    case '30d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 29);
      return { start, end };
    case '60d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 59);
      return { start, end };
    case 'lastMonth':
      // For last month, we want the full previous month
      start = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
      end = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
      return { start, end };
    case 'ytd':
      start = new Date(latestDate.getFullYear(), 0, 1);
      return { start, end };
    default:
      return { start: end, end };
  }
};

// Add this helper function to get a simplified trend indicator
const getSimplifiedTrend = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return { icon: '–', label: 'No Change', type: 'neutral' };
  if (previous === 0) {
    return current > 0 
      ? { icon: '↑', label: 'Positive Signs', type: 'positive' }
      : { icon: '↓', label: 'Negative Signs', type: 'negative' };
  }
  
  const change = current - previous;
  if (Math.abs(change) < 0.01) return { icon: '–', label: 'Stable', type: 'neutral' };
  
  if (change > 0) {
    return { icon: '↑', label: 'Improving', type: 'positive' };
  } else {
    return { icon: '↓', label: 'Declining', type: 'negative' };
  }
};

export const BuyerDashboard = ({ 
  buyer, 
  data,
  offer = 'all',
  network = 'all' 
}: Props) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('mtd');
  const [customDate, setCustomDate] = useState(new Date('2025-01-06'));

  const filteredData = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    
    return data.tableData.filter(row => {
      if (typeof row.date !== 'string') return false;
      
      // Parse MM/DD/YYYY format
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      
      // Get date range based on timeRange
      const { start, end } = getDateRange(timeRange, latestDate);
      
      // Check if date is within range and matches buyer
      return rowDate >= start && 
             rowDate <= end && 
             row.mediaBuyer === buyer;
    });
  }, [data.tableData, buyer, timeRange]);

  const metrics = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    
    const mtdData = filteredData.filter(row => {
      if (typeof row.date !== 'string') return false;
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      const { start, end } = getDateRange(timeRange, latestDate);
      return rowDate >= start && rowDate <= end;
    });

    // Log filtered data
    console.log('Metrics data:', {
      timeRange,
      totalRows: mtdData.length,
      uniqueDates: Array.from(new Set(mtdData.map(row => row.date))).sort()
    });

    return mtdData.reduce(
      (acc, row) => ({
        spend: acc.spend + row.adSpend,
        revenue: acc.revenue + row.adRev,
        profit: acc.profit + row.profit
      }),
      { spend: 0, revenue: 0, profit: 0 }
    );
  }, [filteredData, timeRange, data.tableData]);

  const { offerPerformance, accountPerformance } = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    let timeRangeData, previousPeriodData;
    
    // Move date calculations outside the if block
    const { start: yesterday } = getDateRange('yesterday', latestDate);
    const yesterdayStr = `${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getDate().toString().padStart(2, '0')}/${yesterday.getFullYear()}`;
    
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    const dayBeforeYesterdayStr = `${(dayBeforeYesterday.getMonth() + 1).toString().padStart(2, '0')}/${dayBeforeYesterday.getDate().toString().padStart(2, '0')}/${dayBeforeYesterday.getFullYear()}`;

    if (timeRange === 'yesterday') {
      // Filter data for exact date matches
      timeRangeData = data.tableData.filter(row => 
        row.date === yesterdayStr && row.mediaBuyer === buyer
      );
      
      previousPeriodData = data.tableData.filter(row => 
        row.date === dayBeforeYesterdayStr && row.mediaBuyer === buyer
      );

      // Debug log for Leadnomic Solar specifically
      const leadnomicSolarCurrent = timeRangeData.filter(row => 
        row.network === 'Leadnomic' && row.offer === 'Solar'
      );
      const leadnomicSolarPrevious = previousPeriodData.filter(row => 
        row.network === 'Leadnomic' && row.offer === 'Solar'
      );

      console.log('Leadnomic Solar Raw Data:', {
        yesterday: {
          date: yesterdayStr,
          data: leadnomicSolarCurrent,
          totalProfit: leadnomicSolarCurrent.reduce((sum, row) => sum + row.profit, 0)
        },
        dayBefore: {
          date: dayBeforeYesterdayStr,
          data: leadnomicSolarPrevious,
          totalProfit: leadnomicSolarPrevious.reduce((sum, row) => sum + row.profit, 0)
        }
      });
    } else {
      // Get current period range
      const { start: currentStart, end: currentEnd } = getDateRange(timeRange, latestDate);
      
      // Calculate previous period
      const periodLength = currentEnd.getTime() - currentStart.getTime();
      const previousStart = new Date(currentStart.getTime() - periodLength);
      const previousEnd = new Date(currentStart.getTime() - 1);

      // Filter data for current and previous periods
      timeRangeData = data.tableData.filter(row => {
        const [month, day, year] = row.date.split('/').map(Number);
        const rowDate = new Date(year, month - 1, day);
        return rowDate >= currentStart && 
               rowDate <= currentEnd && 
               row.mediaBuyer === buyer;
      });

      previousPeriodData = data.tableData.filter(row => {
        const [month, day, year] = row.date.split('/').map(Number);
        const rowDate = new Date(year, month - 1, day);
        return rowDate >= previousStart && 
               rowDate <= previousEnd && 
               row.mediaBuyer === buyer;
      });
    }

    // Debug log for all cases
    console.log('Raw Data Check:', {
      timeRange,
      dates: {
        yesterday: yesterdayStr,
        dayBefore: dayBeforeYesterdayStr
      },
      leadnomicSolarData: {
        current: timeRangeData?.filter(row => 
          row.network === 'Leadnomic' && row.offer === 'Solar'
        ),
        previous: previousPeriodData?.filter(row => 
          row.network === 'Leadnomic' && row.offer === 'Solar'
        )
      }
    });

    // Calculate offer performance with trends
    const byOffer = timeRangeData.reduce((acc, row) => {
      const key = `${row.network} - ${row.offer}`;
      if (!acc[key]) {
        acc[key] = { 
          name: key,
          profit: 0, 
          spend: 0, 
          revenue: 0,
          previousPeriodProfit: 0
        };
      }
      acc[key].profit += row.profit;
      acc[key].spend += row.adSpend;
      acc[key].revenue += row.adRev;
      return acc;
    }, {} as Record<string, any>);

    // Add previous period data for offers
    previousPeriodData.forEach(row => {
      const key = `${row.network} - ${row.offer}`;
      if (byOffer[key]) {
        byOffer[key].previousPeriodProfit += row.profit;
      }
    });

    // Calculate trends for offers
    Object.values(byOffer).forEach(offer => {
      if (offer.name === 'Leadnomic - Solar') {
        // More detailed logging for Leadnomic Solar
        console.log('Leadnomic Solar Detailed:', {
          timeRange,
          currentProfit: offer.profit,
          previousProfit: offer.previousPeriodProfit,
          rawCurrentData: timeRangeData.filter(row => 
            row.network === 'Leadnomic' && row.offer === 'Solar'
          ),
          rawPreviousData: previousPeriodData.filter(row => 
            row.network === 'Leadnomic' && row.offer === 'Solar'
          ),
          calculatedTrend: getSimplifiedTrend(offer.profit, offer.previousPeriodProfit)
        });
      }

      // Add debug logging for all offers
      console.log('Trend calculation:', {
        offer: offer.name,
        currentProfit: offer.profit,
        previousProfit: offer.previousPeriodProfit,
        trend: getSimplifiedTrend(offer.profit, offer.previousPeriodProfit)
      });
      
      offer.trend = getTrendIndicator(offer.profit, offer.previousPeriodProfit);
    });

    // Calculate account performance with trends
    const byAccount = timeRangeData.reduce((acc, row) => {
      if (!acc[row.adAccount]) {
        acc[row.adAccount] = { 
          name: row.adAccount,
          profit: 0, 
          spend: 0, 
          revenue: 0,
          previousPeriodProfit: 0
        };
      }
      acc[row.adAccount].profit += row.profit;
      acc[row.adAccount].spend += row.adSpend;
      acc[row.adAccount].revenue += row.adRev;
      return acc;
    }, {} as Record<string, any>);

    // Add previous period data for accounts
    previousPeriodData.forEach(row => {
      if (byAccount[row.adAccount]) {
        byAccount[row.adAccount].previousPeriodProfit += row.profit;
      }
    });

    // Calculate trends for accounts
    Object.values(byAccount).forEach(account => {
      const trend = getSimplifiedTrend(account.profit, account.previousPeriodProfit);
      account.trend = getTrendIndicator(account.profit, account.previousPeriodProfit);
    });

    return {
      offerPerformance: Object.values(byOffer).sort((a, b) => b.profit - a.profit),
      accountPerformance: Object.values(byAccount).sort((a, b) => b.profit - a.profit)
    };
  }, [data.tableData, buyer, timeRange]);

  const dailyProfitData = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    const dailyProfits = new Map();

    // Process each row
    filteredData.forEach(row => {
      try {
        const [month, day, year] = row.date.split('/').map(Number);
        const formattedDate = row.date;
        
        const currentProfit = dailyProfits.get(formattedDate)?.profit || 0;
        dailyProfits.set(formattedDate, {
          date: formattedDate,
          profit: currentProfit + Number(row.profit)
        });
      } catch (e) {
        console.error('Error processing row:', row, e);
      }
    });

    // Fill in missing dates based on selected time range
    const { start: startDate, end: endDate } = getDateRange(timeRange, latestDate);

    // Fill in any missing dates in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const formattedDate = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
      if (!dailyProfits.has(formattedDate)) {
        dailyProfits.set(formattedDate, {
          date: formattedDate,
          profit: 0
        });
      }
    }

    // Log daily profits
    console.log('Daily Profits:', {
      dates: Array.from(dailyProfits.keys()).sort(),
      sampleValues: Array.from(dailyProfits.values()).slice(0, 3)
    });

    return Array.from(dailyProfits.values())
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = a.date.split('/').map(Number);
        const [bMonth, bDay, bYear] = b.date.split('/').map(Number);
        const dateA = new Date(aYear, aMonth - 1, aDay);
        const dateB = new Date(bYear, bMonth - 1, bDay);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredData, timeRange, data.tableData]);

  const roi = metrics.spend > 0 ? (metrics.profit / metrics.spend) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{buyer}'s Dashboard</h2>
        <div className="flex justify-end">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="60d">Last 60 Days</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          title={`${getTimeRangeLabel(timeRange)} Spend`}
          value={metrics.spend}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <MetricCard
          title={`${getTimeRangeLabel(timeRange)} Revenue`}
          value={metrics.revenue}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <MetricCard
          title={`${getTimeRangeLabel(timeRange)} Profit`}
          value={metrics.profit}
          icon={<PieChart className="h-6 w-6" />}
        />
        <ROIWidget roi={roi} />
      </div>

      <DailyProfitChart 
        data={dailyProfitData} 
        timeRange={timeRange}
      />

      <div className="flex flex-col gap-3">
        <SummaryTable 
          data={offerPerformance} 
          title={`${getTimeRangeLabel(timeRange)} Offer Summary`} 
          timeRange={timeRange}
        />
        <SummaryTable 
          data={accountPerformance} 
          title={`${getTimeRangeLabel(timeRange)} Account Summary`} 
          timeRange={timeRange}
        />
      </div>

      <div className="mt-8">
        <RawData 
          buyer={buyer}
          data={{
            ...data,
            tableData: data.tableData
              .filter(row => {
                // Always filter by buyer
                if (row.mediaBuyer !== buyer) return false;

                // Apply network filter if specified
                if (network !== 'all' && row.network !== network) return false;

                // Apply offer filter if specified
                if (offer !== 'all' && row.offer !== offer) return false;

                // Apply time range filter
                const [month, day, year] = row.date.split('/').map(Number);
                const rowDate = new Date(year, month - 1, day);
                const { start, end } = getDateRange(timeRange, getLatestDate(data.tableData));
                return rowDate >= start && rowDate <= end;
              })
          }}
          offer={offer}
          network={network}
        />
      </div>
    </div>
  );
};