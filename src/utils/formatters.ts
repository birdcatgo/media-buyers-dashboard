export const ensureString = (value: any): string => {
  if (value instanceof Date) {
    return value.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }
  return String(value || '');
};

export const formatNumber = (value: number): string => {
  return value.toFixed(2);
};

export const formatDollar = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}; 