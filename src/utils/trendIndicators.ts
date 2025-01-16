interface TrendIndicator {
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
  label: string;
  color: string;
}

export const getTrendIndicator = (current: number, previous: number): TrendIndicator => {
  if (!previous || previous === 0) {
    return {
      type: 'neutral',
      icon: '🆕',
      label: 'New',
      color: 'text-gray-500'
    };
  }

  const percentChange = ((current - previous) / Math.abs(previous)) * 100;
  const absoluteChange = current - previous;

  // Significant improvement
  if (percentChange >= 50 && current > 1000) {
    return {
      type: 'positive',
      icon: '🚀',
      label: 'Growing',
      color: 'text-emerald-500'
    };
  }

  // Steady high performer
  if (percentChange >= 0 && percentChange < 10 && current > 3000) {
    return {
      type: 'positive',
      icon: '⭐',
      label: 'Consistent',
      color: 'text-blue-500'
    };
  }

  // Growing steadily
  if (percentChange >= 10 && percentChange < 50) {
    return {
      type: 'positive',
      icon: '📈',
      label: 'Growing',
      color: 'text-green-500'
    };
  }

  // Slight decline but still profitable
  if (percentChange < 0 && percentChange > -20 && current > 0) {
    return {
      type: 'neutral',
      icon: '📊',
      label: 'Variable',
      color: 'text-yellow-500'
    };
  }

  // Significant decline but still profitable
  if (percentChange <= -20 && current > 0) {
    return {
      type: 'negative',
      icon: '⚠️',
      label: 'Declining',
      color: 'text-orange-500'
    };
  }

  // Critical decline or loss
  if (current < 0 || percentChange <= -50) {
    return {
      type: 'negative',
      icon: '💀',
      label: 'Critical',
      color: 'text-red-500'
    };
  }

  // Default case - stable
  return {
    type: 'neutral',
    icon: '➡️',
    label: 'Stable',
    color: 'text-gray-500'
  };
}; 