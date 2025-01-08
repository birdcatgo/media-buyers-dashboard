import { parse, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const PST_TIMEZONE = 'America/Los_Angeles';

export const formatDate = (value: any): string => {
  if (!value) return '';
  
  // If already a string in correct format, return it
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  try {
    // If it's a Date object
    if (value instanceof Date) {
      return formatInTimeZone(value, PST_TIMEZONE, 'dd/MM/yyyy');
    }

    // If it's a string but wrong format
    if (typeof value === 'string') {
      const parsed = parse(value, 'dd/MM/yyyy', new Date());
      if (!isNaN(parsed.getTime())) {
        return formatInTimeZone(parsed, PST_TIMEZONE, 'dd/MM/yyyy');
      }
    }
  } catch (e) {
    console.error('Date formatting error:', e);
  }

  return '';
};

export const ensureString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
}; 