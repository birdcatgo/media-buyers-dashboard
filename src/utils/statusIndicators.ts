// Create a new file for shared status indicators
export const getROIStatus = (roi: number, spend: number = 0) => {
  if (spend <= 0) return {
    icon: '⚪',
    color: 'text-gray-400',
    label: 'No Data'
  };
  
  if (roi >= 20) return {
    icon: '🟢',
    color: 'text-green-500',
    label: 'High ROI'
  };
  
  if (roi >= 1) return {
    icon: '🟠',
    color: 'text-orange-500',
    label: 'Medium ROI'
  };
  
  return {
    icon: '🔴',
    color: 'text-red-500',
    label: 'Low ROI'
  };
};

export const getTrendIcon = (trend: number) => {
  if (trend === 0 || isNaN(trend)) return '–';
  return trend > 0 ? '↑' : '↓';
};

export const getTrendColor = (trend: number) => {
  if (trend === 0 || isNaN(trend)) return 'text-gray-500';
  return trend > 0 ? 'text-green-500' : 'text-red-500';
}; 