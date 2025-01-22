import { useState, useEffect } from 'react';

export const useCapData = () => {
  const [capData, setCapData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapData = async () => {
      try {
        const response = await fetch('/api/caps');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`API Error: ${data.error} - ${data.details}`);
        }

        console.log('Fetched Cap Data:', {
          sampleEntries: Object.entries(data).slice(0, 3),
          totalEntries: Object.keys(data).length
        });

        setCapData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching cap data:', error);
        setError((error as Error).message);
        setCapData({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapData();
  }, []);

  return { capData, isLoading, error };
}; 