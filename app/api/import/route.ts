import { NextResponse } from 'next/server'
import { getGoogleSheetsClient } from '@/lib/google'
import { getSupabaseAdmin } from '@/lib/supabase'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const PHONE_COLUMN = 'B'
const CRM_STATUS_COLUMN = 'Q' // new column for CRM status

function normalizePhone(raw: any): string {
  if (!raw) return ''
  let s = String(raw).replace(/\D/g, '')
  if (s.startsWith('8') && s.length === 11) s = '7' + s.slice(1)
  if (s.startsWith('9') && s.length === 10) s = '7' + s
  if (s.length === 0) return ''
  return '+' + s
}

export async function GET() {
  const sheets = getGoogleSheetsClient()

  // Read all rows
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Лиды!A1:Q',
  })

  const rows = res.data.values || []
  if (rows.length === 0) {
    return NextResponse.json({ imported: 0 })
  }

  // Find phone column index and CRM status column index
  const headers = rows[0]
  const phoneIdx = headers.indexOf('Телефон')
  const crmStatusIdx = headers.indexOf('CRM статус') === -1 ? -1 : headers.indexOf('CRM статус')

  // If CRM статус column doesn't exist, create it
  if (crmStatusIdx === -1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Лиды!Q1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['CRM статус']] },
    })
  }

  // Get active managers
  const { data: managers, error: managersError } = await getSupabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('role', 'manager')
    .eq('approved', true)
    .eq('active', true)

  if (managersError || !managers || managers.length === 0) {
    return NextResponse.json({ error: 'No active managers', imported: 0 }, { status: 400 })
  }

  // Get existing phones to avoid duplicates
  const { data: existing } = await getSupabaseAdmin().from('candidates').select('phone')
  const existingPhones = new Set((existing?.map((c) => normalizePhone(c.phone)) || []).filter(Boolean))

  const newPhones: string[] = []
  const sheetUpdates: { row: number; value: string }[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rawPhone = row[phoneIdx]?.toString().trim()
    const phone = normalizePhone(rawPhone)
    const crmStatus = crmStatusIdx >= 0 ? row[crmStatusIdx]?.toString().trim() : ''

    if (!phone || crmStatus === 'забрано' || existingPhones.has(phone)) continue

    newPhones.push(phone)
    sheetUpdates.push({ row: i + 1, value: 'забрано' })
  }

  if (newPhones.length === 0) {
    return NextResponse.json({ imported: 0 })
  }

  // Distribute evenly
  const imports = newPhones.map((phone, idx) => ({
    phone,
    manager_id: managers[idx % managers.length].id,
    status: 'На обзвон',
    imported_from_sheets: true,
    sheet_row_index: sheetUpdates[idx]?.row,
  }))

  const { error: insertError } = await getSupabaseAdmin().from('candidates').insert(imports)
  if (insertError) {
    return NextResponse.json({ error: insertError.message, imported: 0 }, { status: 500 })
  }

  // Mark as taken in sheet
  const updateRequests = sheetUpdates.map((u) => ({
    range: `Лиды!Q${u.row}`,
    values: [[u.value]],
  }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updateRequests,
    },
  })

  return NextResponse.json({ imported: imports.length })
}
