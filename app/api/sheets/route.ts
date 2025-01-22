import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY || 
        !process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('Missing required environment variables');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'raw data!A2:L',
    });

    if (!response.data.values) {
      console.log('No data found in spreadsheet');
      return NextResponse.json([], { status: 200 });
    }

    // Process and validate each row
    const processedData = response.data.values
      .filter(row => row.length >= 9) // Ensure row has minimum required columns
      .map(row => {
        // Just use the date string as is from the sheet
        const dateStr = row[1] || '';

        // Clean number function
        const cleanNumber = (value: string): number => {
          if (!value) return 0;
          const cleaned = value.replace(/[$£€,\s]/g, '').trim();
          return parseFloat(cleaned) || 0;
        };

        return {
          date: dateStr,
          mediaBuyer: String(row[2] || '').trim(),
          offer: String(row[3] || '').trim(),
          network: String(row[4] || '').trim(),
          adAccount: String(row[5] || '').trim(),
          adRev: cleanNumber(row[6]),
          adSpend: cleanNumber(row[7]),
          profit: cleanNumber(row[8])
        };
      })
      .filter(row => row.date && row.mediaBuyer && row.network); // Filter out rows with missing essential data

    return NextResponse.json(processedData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data from Google Sheets' }, 
      { status: 500 }
    );
  }
}