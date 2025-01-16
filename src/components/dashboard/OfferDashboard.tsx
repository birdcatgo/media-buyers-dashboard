import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { DashboardData } from '@/types/dashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDollar } from '@/utils/formatters';
import { getROIStatus, getTrendIcon, getTrendColor } from '@/utils/statusIndicators';
import { getTrendIndicator } from '@/utils/trendIndicators';

type TimeRange = 'yesterday' | '7d' | '14d' | 'mtd' | '30d' | '60d' | 'lastMonth' | 'ytd';

// Add this type for our data points
type DataPoint = {
  date: string;
  profit: number;
  spend: number;
  revenue: number;
};

// Add this helper function at the top
const validateDates = (data: any[]) => {
  const dateMap = new Map<string, any[]>();
  const invalidDates: any[] = [];

  data.forEach(row => {
    try {
      if (typeof row.date !== 'string') {
        invalidDates.push(row);
        return;
      }

      const [month, day, year] = row.date.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        invalidDates.push(row);
        return;
      }

      const key = row.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, []);
      }
      dateMap.get(key)?.push(row);
    } catch (e) {
      invalidDates.push(row);
    }
  });

  return {
    validDates: Array.from(dateMap.entries()).map(([date, rows]) => ({
      date,
      rowCount: rows.length,
      sampleRows: rows.slice(0, 2)
    })),
    invalidDates,
    dateDistribution: Array.from(dateMap.keys()).sort(),
    summary: {
      totalRows: data.length,
      validRows: data.length - invalidDates.length,
      uniqueDates: dateMap.size
    }
  };
};

// Add getDateRange helper function
const getDateRange = (timeRange: TimeRange, latestDate: Date): { start: Date, end: Date } => {
  // Validate input date
  if (!(latestDate instanceof Date) || isNaN(latestDate.getTime())) {
    latestDate = new Date();
  }

  let start: Date;
  let end = new Date(latestDate);
  end.setHours(23, 59, 59, 999);

  switch (timeRange) {
    case 'yesterday':
      // For yesterday, we want the latest date as end and one day before as start
      end = new Date(latestDate);
      end.setHours(23, 59, 59, 999);
      
      start = new Date(latestDate);
      start.setDate(latestDate.getDate());  // Set to current date
      start.setHours(0, 0, 0, 0);
      
      // Debug log for yesterday dates
      console.log('Yesterday Range Debug:', {
        latestDate: latestDate.toLocaleDateString(),
        start: start.toLocaleDateString(),
        end: end.toLocaleDateString(),
        dateStrings: {
          latestDateStr: `${(latestDate.getMonth() + 1).toString().padStart(2, '0')}/${latestDate.getDate().toString().padStart(2, '0')}/${latestDate.getFullYear()}`,
          yesterdayStr: `${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getDate().toString().padStart(2, '0')}/${start.getFullYear()}`
        }
      });
      break;

    case 'mtd':
      start = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      break;

    case '7d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 6);
      break;

    case '14d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 13);
      break;

    case '30d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 29);
      break;

    case '60d':
      start = new Date(latestDate);
      start.setDate(latestDate.getDate() - 59);
      break;

    case 'lastMonth':
      start = new Date(latestDate.getFullYear(), latestDate.getMonth() - 1, 1);
      end = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
      break;

    case 'ytd':
      start = new Date(latestDate.getFullYear(), 0, 1);
      break;

    default:
      start = new Date(latestDate);
      break;
  }

  // Set hours for start date
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

// Update getFilteredData function
const getFilteredData = (data: any[], timeRange: TimeRange) => {
  const latestDate = getLatestDate(data);
  const { start, end } = getDateRange(timeRange, latestDate);
  
  // Debug log for filtering
  console.log('Filtering Data:', {
    timeRange,
    dateRange: {
      start: start.toLocaleDateString(),
      end: end.toLocaleDateString()
    },
    sampleData: data.slice(0, 2).map(row => ({
      date: row.date,
      isIncluded: (() => {
        const [month, day, year] = row.date.split('/').map(Number);
        const rowDate = new Date(year, month - 1, day);
        rowDate.setHours(12, 0, 0, 0);
        return rowDate >= start && rowDate <= end;
      })()
    }))
  });
  
  return data.filter(row => {
    if (typeof row.date !== 'string') return false;
    
    const [month, day, year] = row.date.split('/').map(Number);
    const rowDate = new Date(year, month - 1, day);
    rowDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    return rowDate >= start && rowDate <= end;
  });
};

// Add getLatestDate helper function
const getLatestDate = (data: any[]): Date => {
  // Get all valid dates from the data
  const dates = data
    .map(row => {
      if (!row.date) return null;
      const [month, day, year] = row.date.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter((date): date is Date => date !== null);

  // Find the most recent date
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Debug log
  console.log('Latest Date Debug:', {
    allDates: dates.map(d => d.toLocaleDateString()),
    maxDate: maxDate.toLocaleDateString(),
    dateCount: dates.length,
    sampleRows: data.slice(0, 2).map(row => row.date)
  });

  return maxDate;
};

// Add type for metric
type MetricType = 'profit' | 'roi';

// Inside the LineChart component, add a trend line by calculating the linear regression
const Chart = ({ data, selectedOffers, metricType }: { 
  data: any[]; 
  selectedOffers: string[];
  metricType: 'profit' | 'roi';
}) => {
  // Add data validation
  if (!data?.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>No data available for the selected period</p>
      </div>
    );
  }

  const dataWithTrend = useMemo(() => {
    const n = data.length;
    if (n < 2) return data;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = Number(point.Total) || 0;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((point, index) => ({
      ...point,
      trend: slope * index + intercept
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={dataWithTrend}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
        />
        <YAxis
          tickFormatter={(value) => 
            metricType === 'profit'
              ? `$${(value / 1000).toFixed(1)}k`
              : `${value.toFixed(1)}%`
          }
          width={80}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            metricType === 'profit'
              ? `$${value.toLocaleString()}`
              : `${value.toFixed(1)}%`,
            name === 'trend' ? 'Trend' : name
          ]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        {selectedOffers.length === 0 ? (
          <>
            <Line
              type="monotone"
              dataKey="Total"
              name="Daily Total"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: "#2563eb" }}
              activeDot={{ r: 5, stroke: "#2563eb", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="trend"
              name="Trend"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="5 5"
              strokeOpacity={0.4}
              dot={false}
              isAnimationActive={false}
            />
          </>
        ) : (
          selectedOffers.map((offer, index) => {
            const color = `hsl(${(index * 360) / selectedOffers.length}, 70%, 50%)`;
            return (
              <React.Fragment key={offer}>
                <Line
                  type="monotone"
                  dataKey={offer}
                  name={offer}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color }}
                  activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </React.Fragment>
            );
          })
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

const SummaryTable = ({ data, title, timeRange }: { 
  data: any[]; 
  title: string;
  timeRange: TimeRange;
}) => {
  // Calculate trend for each row
  const getPerformanceTrend = (row: any) => {
    if (!row.previousPeriodProfit) return 'NC';
    const change = row.profit - row.previousPeriodProfit;
    if (Math.abs(change) < 0.01) return 'NC';
    return change > 0 ? '↑' : '↓';
  };

  // Updated status indicator based on ROI thresholds
  const getStatusIndicator = (spend: number, profit: number) => {
    if (spend <= 0) return '⚪'; // No data
    const roi = (profit / spend) * 100;
    if (roi >= 20) return '🟢';      // ROI >= 20%
    if (roi >= 1) return '🟠';       // ROI between 1-19%
    return '🔴';                      // ROI < 1%
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Offer</th>
                <th className="text-right p-2">Spend</th>
                <th className="text-right p-2">Revenue</th>
                <th className="text-right p-2">Profit</th>
                <th className="text-right p-2">ROI</th>
                <th className="text-center p-2">Status</th>
                <th className="text-center p-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const roi = row.spend > 0 ? (row.profit / row.spend) * 100 : 0;
                const status = (() => {
                  if (row.spend <= 0) return '⚪';
                  if (roi >= 20) return '🟢';
                  if (roi >= 1) return '🟠';
                  return '🔴';
                })();
                const trend = getTrendIndicator(row.profit, row.previousPeriodProfit);

                return (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{row.name}</td>
                    <td className="text-right p-2">{formatDollar(row.spend)}</td>
                    <td className="text-right p-2">{formatDollar(row.revenue)}</td>
                    <td className="text-right p-2">{formatDollar(row.profit)}</td>
                    <td className="text-right p-2">
                      {row.spend > 0 ? `${roi.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="text-center p-2">{status}</td>
                    <td className="text-center p-2 font-bold">{trend.icon}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const getTimeRangeLabel = (timeRange: TimeRange): string => {
  switch (timeRange) {
    case 'yesterday': return "Yesterday's";
    case '7d': return 'Last 7 Days';
    case '14d': return 'Last 14 Days';
    case 'mtd': return 'MTD';
    case '30d': return 'Last 30 Days';
    case '60d': return 'Last 60 Days';
    case 'lastMonth': return 'Last Month';
    case 'ytd': return 'YTD';
    default: return '';
  }
};

interface OfferPerformance {
  name: string;
  profit: number;
  spend: number;
  revenue: number;
  previousPeriodProfit: number;
}

// Add this new component after the existing Chart component
const TotalProfitChart = ({ 
  data, 
  selectedOffers,
  networkOffers,
  setSelectedOffers
}: { 
  data: any[];
  selectedOffers: string[];
  networkOffers: string[];
  setSelectedOffers: (offers: string[]) => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={selectedOffers.join(',') || 'all'}
          onValueChange={(value) => setSelectedOffers(value === 'all' ? [] : value.split(','))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select offers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Offers</SelectItem>
            {networkOffers.map(offer => (
              <SelectItem key={offer} value={offer}>
                {offer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 80, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Daily Profit']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          {selectedOffers.length === 0 ? (
            <Line
              type="monotone"
              dataKey="Total"
              name="Total Profit"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563eb" }}
              isAnimationActive={false}
            />
          ) : (
            selectedOffers.map((offer, index) => {
              const color = `hsl(${(index * 360) / selectedOffers.length}, 70%, 50%)`;
              return (
                <Line
                  key={offer}
                  type="monotone"
                  dataKey={offer}
                  name={offer}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: color }}
                  isAnimationActive={false}
                />
              );
            })
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OfferDashboard = ({
  data
}: {
  data: DashboardData;
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('mtd');
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [metricType, setMetricType] = useState<MetricType>('profit');

  // Add date validation logging
  console.log('Date Validation:', validateDates(data.tableData));

  // Get unique network-offer combinations
  const networkOffers = useMemo(() => {
    const combinations = new Set<string>();
    data.tableData.forEach(row => {
      // Special handling for Suited - ACA
      if (row.network === 'Suited' && row.offer === 'ACA') {
        combinations.add('ACA - ACA');
      } else {
        combinations.add(`${row.network} - ${row.offer}`);
      }
    });
    return Array.from(combinations).sort();
  }, [data.tableData]);

  // Update combinedData to handle both profit and ROI
  const combinedData = useMemo(() => {
    const filteredData = getFilteredData(data.tableData, timeRange);
    const dailyData = new Map();

    // Get date range
    const { start, end } = getDateRange(timeRange, getLatestDate(data.tableData));

    // Initialize all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
      dailyData.set(key, {
        date: key,
        Total: 0,
        ...networkOffers.reduce((acc, offer) => ({ ...acc, [offer]: 0 }), {})
      });
    }

    // Populate data
    filteredData.forEach(row => {
      const entry = dailyData.get(row.date);
      if (!entry) return;

      let offerKey = `${row.network} - ${row.offer}`;
      if (row.network === 'Suited' && row.offer === 'ACA') {
        offerKey = 'ACA - ACA';
      }

      const value = metricType === 'profit' ? row.profit : (row.adSpend > 0 ? (row.profit / row.adSpend) * 100 : 0);

      entry.Total = (Number(entry.Total) || 0) + value;
      if (offerKey in entry) {
        entry[offerKey] = (Number(entry[offerKey]) || 0) + value;
      }
    });

    const result = Array.from(dailyData.values())
      .sort((a, b) => {
        const [aMonth, aDay, aYear] = (a.date as string).split('/').map(Number);
        const [bMonth, bDay, bYear] = (b.date as string).split('/').map(Number);
        return new Date(aYear, aMonth - 1, aDay).getTime() - 
               new Date(bYear, bMonth - 1, bDay).getTime();
      });

    console.log('Combined Data:', {
      totalDays: result.length,
      dateRange: { start: result[0]?.date, end: result[result.length - 1]?.date },
      sampleValues: result.slice(0, 3).map(d => ({ date: d.date, Total: d.Total }))
    });

    return result;
  }, [data.tableData, timeRange, networkOffers, metricType]);

  // Add more detailed debug logging
  console.log('Chart Data Debug:', {
    sampleData: combinedData.slice(0, 3).map(d => ({
      date: d.date,
      Total: d.Total,
      sampleOffers: Object.entries(d)
        .filter(([key]) => key !== 'date' && key !== 'Total')
        .slice(0, 3)
    })),
    totalDays: combinedData.length,
    offers: networkOffers,
    timeRange,
    hasData: combinedData.some(d => d.Total !== 0)
  });

  // Add this at the top of the component, after the useMemos
  const sortedOfferPerformance = useMemo(() => {
    const filteredTableData = getFilteredData(data.tableData, timeRange);
    const latestDate = getLatestDate(data.tableData);
    
    // Calculate previous period
    const { start: currentStart, end: currentEnd } = getDateRange(timeRange, latestDate);
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart.getTime() - 1);

    const metrics = new Map<string, { 
      spend: number; 
      revenue: number; 
      profit: number;
      previousPeriodProfit: number;
    }>();

    // Process current period
    filteredTableData.forEach(row => {
      let key = `${row.network} - ${row.offer}`;
      if (row.network === 'Suited' && row.offer === 'ACA') {
        key = 'ACA - ACA';
      }

      const current = metrics.get(key) || { 
        spend: 0, 
        revenue: 0, 
        profit: 0,
        previousPeriodProfit: 0
      };
      
      metrics.set(key, {
        spend: current.spend + row.adSpend,
        revenue: current.revenue + row.adRev,
        profit: current.profit + row.profit,
        previousPeriodProfit: current.previousPeriodProfit
      });
    });

    // Process previous period
    data.tableData.forEach(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      if (rowDate >= previousStart && rowDate <= previousEnd) {
        let key = `${row.network} - ${row.offer}`;
        if (row.network === 'Suited' && row.offer === 'ACA') {
          key = 'ACA - ACA';
        }
        
        const current = metrics.get(key);
        if (current) {
          current.previousPeriodProfit += row.profit;
        }
      }
    });

    return Array.from(metrics.entries())
      .map(([name, values]) => ({
        name,
        ...values
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [data.tableData, timeRange]);

  // Update the data preparation for the table to include previous period data
  const { offerPerformance } = useMemo(() => {
    const latestDate = getLatestDate(data.tableData);
    const timeRangeData = getFilteredData(data.tableData, timeRange);
    
    // Calculate previous period
    const { start: currentStart, end: currentEnd } = getDateRange(timeRange, latestDate);
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart.getTime() - 1);

    // Get previous period data
    const previousPeriodData = data.tableData.filter(row => {
      const [month, day, year] = row.date.split('/').map(Number);
      const rowDate = new Date(year, month - 1, day);
      return rowDate >= previousStart && rowDate <= previousEnd;
    });

    // Calculate performance including previous period
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

    // Add previous period data
    previousPeriodData.forEach(row => {
      const key = `${row.network} - ${row.offer}`;
      if (byOffer[key]) {
        byOffer[key].previousPeriodProfit = (byOffer[key].previousPeriodProfit || 0) + row.profit;
      }
    });

    return {
      offerPerformance: (Object.values(byOffer) as OfferPerformance[])
        .sort((a, b) => b.profit - a.profit)
    };
  }, [data.tableData, timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offer Performance</h2>
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

      <Card>
        <CardHeader>
          <CardTitle>All Offers Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Offer</th>
                  <th className="text-right p-2">Spend</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Profit</th>
                  <th className="text-right p-2">ROI</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedOfferPerformance.map((row, idx) => {
                  const roi = row.spend > 0 ? (row.profit / row.spend) * 100 : 0;
                  const status = getROIStatus(roi, row.spend);
                  const trend = getTrendIndicator(row.profit, row.previousPeriodProfit);

                  return (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{row.name}</td>
                      <td className="text-right p-2">{formatDollar(row.spend)}</td>
                      <td className="text-right p-2">{formatDollar(row.revenue)}</td>
                      <td className="text-right p-2">{formatDollar(row.profit)}</td>
                      <td className="text-right p-2">
                        {row.spend > 0 ? `${roi.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="text-center p-2">
                        <span title={status.label}>{status.icon}</span>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <span className={
                            trend.type === 'positive' ? 'text-green-500' :
                            trend.type === 'negative' ? 'text-red-500' :
                            'text-gray-500'
                          }>
                            {trend.icon}
                          </span>
                          <span className="text-xs text-gray-500">
                            {trend.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chart Title */}
      <h3 className="text-lg font-semibold mb-6 text-center">
        Daily {metricType === 'profit' ? 'Profit' : 'ROI'} by Offer
      </h3>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Profit by Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <TotalProfitChart 
            data={combinedData} 
            selectedOffers={selectedOffers}
            networkOffers={networkOffers}
            setSelectedOffers={setSelectedOffers}
          />
        </CardContent>
      </Card>
    </div>
  );
}; 