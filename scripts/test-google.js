const { google } = require('googleapis');
const credentials = require('/tmp/gkey.json');

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function test() {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1jDLvwIWn2pImdOC3hf5lGy3C3j0KflG5yiMbrRQAzDM',
    range: 'Лиды!A1:Q5',
  });
  console.log('Headers:', res.data.values?.[0]);
  console.log('Row 1:', res.data.values?.[1]);
}

test().catch((err) => {
  console.error('ERROR:', err.response?.data?.error?.message || err.message);
  process.exit(1);
});
