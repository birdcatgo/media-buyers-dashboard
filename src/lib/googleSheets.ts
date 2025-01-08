// src/lib/googleSheets.ts
import { TableData } from '../types/dashboard';

export async function fetchGoogleSheetsData(): Promise<TableData[]> {
  try {
    const response = await fetch('/api/sheets');
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Keep dates as strings in MM/DD/YYYY format
    const processedData = data.map(row => ({
      date: row.date.includes('/') ? row.date : new Date(row.date).toLocaleDateString('en-US'),
      mediaBuyer: String(row.mediaBuyer || ''),
      offer: String(row.offer || ''),
      network: String(row.network || ''),
      adAccount: String(row.adAccount || ''),
      adRev: Number(row.adRev) || 0,
      adSpend: Number(row.adSpend) || 0,
      profit: Number(row.profit) || 0
    }));

    return processedData;
  } catch (err) {
    return [];
  }
}