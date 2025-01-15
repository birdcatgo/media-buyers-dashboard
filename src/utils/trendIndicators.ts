export const getSimplifiedTrend = (current: number, previous: number) => {
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