// src/lib/googleSheets.ts
import { TableData } from '../types/dashboard';

export async function fetchGoogleSheetsData(): Promise<TableData[]> {
  try {
    console.log('Fetching sheets data...');
    const response = await fetch('/api/sheets');
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText
      });
      return [];
    }

    const data = await response.json();
    console.log('API Response:', {
      hasData: !!data,
      isArray: Array.isArray(data),
      length: data?.length,
      firstRow: data?.[0],
      keys: data?.[0] ? Object.keys(data[0]) : []
    });

    if (!data || !Array.isArray(data)) return [];

    const processedData = data.map((row, index) => {
      // Log every 100th row for debugging
      if (index % 100 === 0) {
        console.log(`Processing row ${index}:`, row);
      }

      return {
        date: String(row.date || '').trim(),
        mediaBuyer: String(row.mediaBuyer || '').trim(),
        offer: String(row.offer || '').trim(),
        network: String(row.network || '').trim(),
        adAccount: String(row.adAccount || '').trim(),
        adRev: Number(String(row.adRev).replace(/[^0-9.-]+/g, '')) || 0,
        adSpend: Number(String(row.adSpend).replace(/[^0-9.-]+/g, '')) || 0,
        profit: Number(String(row.profit).replace(/[^0-9.-]+/g, '')) || 0
      };
    });

    console.log('Processed data:', {
      length: processedData.length,
      firstRow: processedData[0],
      lastRow: processedData[processedData.length - 1]
    });

    return processedData;
  } catch (err) {
    console.error('Error in fetchGoogleSheetsData:', err);
    return [];
  }
}