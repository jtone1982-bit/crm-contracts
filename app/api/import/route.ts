import { NextResponse } from 'next/server'
import { getGoogleSheetsClient } from '@/lib/google'
import { getSupabaseAdmin } from '@/lib/supabase'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const CRM_STATUS_HEADER = 'CRM статус'
const STATUS_MARK = 'Забрано'

function normalizePhone(raw: any): string {
  if (!raw) return ''
  let s = String(raw).replace(/\D/g, '')
  if (s.startsWith('8') && s.length === 11) s = '7' + s.slice(1)
  if (s.startsWith('9') && s.length === 10) s = '7' + s
  if (s.length === 0) return ''
  return '+' + s
}

function colLetter(idx: number): string {
  let s = ''
  let n = idx
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

export async function GET() {
  const sheets = getGoogleSheetsClient()

  // Read first row to find headers (no sheet name = first sheet)
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'A1:Z1',
  })

  const headerRow = headerRes.data.values?.[0] || []
  if (headerRow.length === 0) {
    return NextResponse.json({ imported: 0 })
  }

  let phoneIdx = headerRow.indexOf('Телефон')
  let crmStatusIdx = headerRow.indexOf(CRM_STATUS_HEADER)

  if (phoneIdx === -1) phoneIdx = 1

  // Add CRM status column if missing
  if (crmStatusIdx === -1) {
    crmStatusIdx = headerRow.length
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${colLetter(crmStatusIdx)}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[CRM_STATUS_HEADER]] },
    })
  }

  // Read full data
  const fullRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `A1:${colLetter(crmStatusIdx)}`,
  })

  const allRows = fullRes.data.values || []
  if (allRows.length === 0) {
    return NextResponse.json({ imported: 0 })
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

  // Get existing phones
  const { data: existing } = await getSupabaseAdmin().from('candidates').select('phone')
  const existingPhones = new Set((existing?.map((c) => normalizePhone(c.phone)) || []).filter(Boolean))

  const newPhones: string[] = []
  const sheetUpdates: { row: number; value: string }[] = []

  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i]
    const rawPhone = row[phoneIdx]?.toString().trim()
    const phone = normalizePhone(rawPhone)
    const crmStatus = crmStatusIdx >= 0 ? row[crmStatusIdx]?.toString().trim() : ''

    if (!phone || crmStatus === STATUS_MARK || existingPhones.has(phone)) continue

    newPhones.push(phone)
    sheetUpdates.push({ row: i + 1, value: STATUS_MARK })
  }

  if (newPhones.length === 0) {
    return NextResponse.json({ imported: 0 })
  }

  // Distribute by current candidate count (least loaded manager gets next lead)
  const { data: counts } = await getSupabaseAdmin()
    .from('candidates')
    .select('manager_id, count', { count: 'exact' })
    .in('manager_id', managers.map((m) => m.id))

  const countMap = new Map<string, number>()
  managers.forEach((m) => countMap.set(m.id, 0))
  counts?.forEach((c: any) => {
    countMap.set(c.manager_id, Number(c.count || 0))
  })

  const imports = newPhones.map((phone) => {
    let minId = managers[0].id
    let minCount = Infinity
    managers.forEach((m) => {
      const c = countMap.get(m.id) || 0
      if (c < minCount) {
        minCount = c
        minId = m.id
      }
    })
    countMap.set(minId, minCount + 1)
    return {
      phone,
      manager_id: minId,
      status: 'На обзвон',
      imported_from_sheets: true,
    }
  })

  const { error: insertError } = await getSupabaseAdmin().from('candidates').insert(imports)
  if (insertError) {
    return NextResponse.json({ error: insertError.message, imported: 0 }, { status: 500 })
  }

  // Mark as taken in sheet
  const statusCol = colLetter(crmStatusIdx)
  const updateRequests = sheetUpdates.map((u) => ({
    range: `${statusCol}${u.row}`,
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