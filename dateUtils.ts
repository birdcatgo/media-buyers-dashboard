export const getLatestDate = (data: any[]): Date => {
  const validDates = data
    .map(row => {
      if (!row.date) return null;
      const [month, day, year] = row.date.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    })
    .filter((date): date is Date => date !== null);

  return new Date(Math.max(...validDates.map(d => d.getTime())));
};

export const filterDataByDateRange = (
  data: any[],
  dateRange: 'yesterday' | 'mtd' | '7d' | 'all'
): any[] => {
  if (!data.length) return [];

  // Get the latest date from the data
  const latestDate = getLatestDate(data);
  let startDate: Date;
  let endDate: Date = latestDate;

  switch (dateRange) {
    case 'yesterday':
      startDate = new Date(latestDate);
      startDate.setDate(latestDate.getDate() - 1);
      endDate = new Date(startDate); // Show only yesterday's data
      break;
    case 'mtd':
      startDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      break;
    case '7d':
      startDate = new Date(latestDate);
      startDate.setDate(latestDate.getDate() - 7);
      break;
    default: // 'all'
      startDate = new Date(2024, 11, 1); // December 1st, 2024
      endDate = latestDate;
  }

  return data.filter(row => {
    const [month, day, year] = row.date.split('/').map(Number);
    const rowDate = new Date(year, month - 1, day);
    return rowDate >= startDate && rowDate <= endDate;
  });
};