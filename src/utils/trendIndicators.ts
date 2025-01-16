export const getSimplifiedTrend = (current: number, previous: number) => {
  // If no previous data or both are zero, return neutral trend
  if (!previous && !current) {
    return {
      type: 'neutral',
      icon: '–',
      label: 'NC'
    };
  }

  // If only previous is zero/null, compare with zero
  if (!previous || previous === 0) {
    return {
      type: current > 0 ? 'positive' : current < 0 ? 'negative' : 'neutral',
      icon: current > 0 ? '↑' : current < 0 ? '↓' : '–',
      label: current === 0 ? 'NC' : 'New'
    };
  }

  // Calculate the change
  const change = current - previous;
  
  // If change is minimal, return neutral
  if (Math.abs(change) < 0.01) {
    return {
      type: 'neutral',
      icon: '–',
      label: 'NC'
    };
  }

  // Special handling for improvement from negative to positive
  if (previous < 0 && current > 0) {
    return {
      type: 'positive',
      icon: '↑',
      label: 'Improved'
    };
  }

  // Calculate percentage change
  const percentChange = (change / Math.abs(previous)) * 100;

  // Determine if trend is positive (either increased positive or decreased negative)
  const isPositive = (previous > 0 && change > 0) || (previous < 0 && change < 0);

  return {
    type: isPositive ? 'positive' : 'negative',
    icon: isPositive ? '↑' : '↓',
    label: `${Math.abs(percentChange).toFixed(1)}%`
  };
}; 