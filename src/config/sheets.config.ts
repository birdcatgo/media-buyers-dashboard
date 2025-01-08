const GOOGLE_SHEETS_CONFIG = {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    serviceAccountAuth: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    range: 'raw data!A2:L'
  };
  
  export default GOOGLE_SHEETS_CONFIG;