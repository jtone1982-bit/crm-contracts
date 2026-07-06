import { google } from 'googleapis'
import path from 'path'

const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

async function test() {
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Лиды!A1:Q5',
  })
  console.log('Headers:', res.data.values?.[0])
  console.log('Row 1:', res.data.values?.[1])
}

test().catch((err) => {
  console.error('ERROR:', err.response?.data?.error?.message || err.message)
  process.exit(1)
})
