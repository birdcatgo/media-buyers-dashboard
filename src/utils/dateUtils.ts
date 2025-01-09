// src/utils/dateUtils.ts

/**
 * Convert DD/MM/YYYY to MM/DD/YYYY
 */
const toMMDDYYYY = (dateStr: string): string => {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/');
  return `${month}/${day}/${year}`;
};

/**
 * Parse a date string in DD/MM/YYYY format and convert to Date object
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return !isNaN(date.getTime()) ? date : null;
  } catch (e) {
    console.error('Date parsing error:', { dateStr, error: e });
    return null;
  }
};

/**
 * Format a Date object as DD/MM/YYYY
 */
const formatDDMMYYYY = (date: Date): string => {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

/**
 * Get the latest date from a dataset
 */
const getLatestDate = (data: any[]): Date => {
  const dates = data
    .map(row => {
      const parsed = parseDate(row.date || row.Date);
      return parsed;
    })
    .filter((date): date is Date => date !== null);
  
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
  return latestDate;
};

/**
 * Filter data based on a date range relative to the latest date
 */
const filterDataByDateRange = (
  data: any[],
  dateRange: 'yesterday' | 'mtd' | '7d' | 'all'
): any[] => {
  if (!data.length) return [];

  // Get the last day of January 2025
  const endDate = new Date(2025, 1, 0); // January 31st, 2025
  let startDate: Date;

  switch (dateRange) {
    case 'yesterday':
      startDate = new Date(2025, 0, 8);
      endDate.setDate(8);
      break;
    case 'mtd':
      startDate = new Date(2025, 0, 1);
      break;
    case '7d':
      startDate = new Date(2025, 0, 2);
      endDate.setDate(8);
      break;
    default: // 'all'
      startDate = new Date(2024, 11, 1);
  }

  // Add debug logging for date comparison
  const debugRow = data[0];
  console.log('Date debug:', {
    range: dateRange,
    startDate: startDate.toLocaleDateString(),
    endDate: endDate.toLocaleDateString(),
    sampleRow: {
      originalDate: debugRow.date,
      parsedParts: debugRow.date.split('/').map(Number),
      resultDate: new Date(
        Number(debugRow.date.split('/')[2]), // year
        Number(debugRow.date.split('/')[0]) - 1, // month (0-based)
        Number(debugRow.date.split('/')[1]) // day
      ).toLocaleDateString()
    }
  });

  return data.filter(row => {
    // Assuming dates are in MM/DD/YYYY format
    const [month, day, year] = row.date.split('/').map(Number);
    const rowDate = new Date(year, month - 1, day);
    
    const isInRange = rowDate >= startDate && rowDate <= endDate;
    
    // Debug every 100th row
    if (Math.random() < 0.01) {
      console.log('Row date check:', {
        original: row.date,
        parsed: rowDate.toLocaleDateString(),
        start: startDate.toLocaleDateString(),
        end: endDate.toLocaleDateString(),
        isInRange
      });
    }
    
    return isInRange;
  });
};

export { parseDate, toMMDDYYYY, formatDDMMYYYY, getLatestDate, filterDataByDateRange };