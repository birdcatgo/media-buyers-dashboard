import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 
        !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
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
    
    const SPREADSHEET_ID = '1ifgpaLBY0uF8KeFgSaICPoueNJvORKSloSb9jWnolrg';
    
    // Get data from Network Payment Schedule sheet, columns A through K
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Network Payment Schedule'!A:K",  // Note the single quotes around sheet name
    });

    if (!response.data.values) {
      console.log('No values found in Network Payment Schedule sheet');
      return NextResponse.json({}, { status: 200 });
    }

    console.log('Sheet data:', {
      rowCount: response.data.values.length,
      sampleRow: response.data.values[0], // Log header row
      sampleData: response.data.values.slice(1, 3) // Log first two data rows
    });

    const capsData = response.data.values
      .slice(1)  // Skip header row
      .reduce((acc, row) => {
        if (row[0] && row[1]) {  // If network and offer exist
          const network = String(row[0]).trim();
          const offer = String(row[1]).trim();
          const key = `${network}-${offer}`;
          const dailyCap = parseFloat(String(row[3] || '0').replace(/[$,]/g, '')) || 0;
          
          acc[key] = dailyCap;
        }
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json(capsData);

  } catch (err) {
    const error = err as Error;
    console.error('Caps API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch cap data from Google Sheets',
        details: error.message,
        type: error.name
      }, 
      { status: 500 }
    );
  }
} 