import { NextResponse } from 'next/server'
import { getGoogleSheetsClient } from '@/lib/google'
import { getSupabaseAdmin } from '@/lib/supabase'

const CRM_STATUS_HEADER = 'CRM статус'
const STATUS_MARK = 'Забрано'

// Manager sheets: фамилия → spreadsheet ID
// Synced with /opt/crm-scripts/chence_to_manager_sheets.py MANAGERS list
const MANAGER_SHEETS: { name: string; sheetId: string }[] = [
  { name: 'Зорькина', sheetId: '1339y_T9_mnfyiXHEwpCUa8rhf-OCCIYMgF_eICsxVno' },
  { name: 'Духина', sheetId: '1MmhqEy5NoYn8ed7fxeP-Od_OOy66xyZtzLHVGwAQSxA' },
  { name: 'Кира', sheetId: '1m2QLv5IaE9o2d-38-MYgwyzBsGx8TdN7eA13ArCoogs' },
  { name: 'Карымова', sheetId: '1MUMnGPnWf6aIOnhPF6xRZkj-t9oi90i_ZwoU49O9xbY' },
  { name: 'Жеребцова', sheetId: '1oObzPpps3l8-8eIfJDnDURO63J421840utPR4yV06nk' },
  { name: 'Тарасюк', sheetId: '1Y904RUIhMtlCFdWQtJMkcAJwzfD4NwO_FIlxk3udflo' },
  { name: 'Лаевская', sheetId: '1VxD0fLNKt_TAmjutm1ClhLNzWsv9UuHf46IZJ7mgomc' },
  { name: 'Абрегова', sheetId: '1YcJGN6Bp_ksb10Ro04HOabexbix5Ghf8NeiR3a8hTtQ' },
]

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

// Extract surname (first word) from full name
function getSurname(fullName: string): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0]
}

// Fuzzy match: check if CRM manager surname matches sheet manager name
function matchManager(
  crmManagers: { id: string; full_name: string }[],
  sheetName: string
): { id: string; full_name: string } | null {
  const sheetSurname = sheetName.trim().toLowerCase()
  for (const m of crmManagers) {
    const crmSurname = getSurname(m.full_name || '').trim().toLowerCase()
    if (!crmSurname) continue
    // Match if CRM surname starts with sheet name or vice versa
    if (crmSurname === sheetSurname || crmSurname.startsWith(sheetSurname) || sheetSurname.startsWith(crmSurname)) {
      return m
    }
  }
  return null
}

export async function GET() {
  const sheets = getGoogleSheetsClient()

  // Get active managers from CRM
  const { data: crmManagers, error: managersError } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'manager')
    .eq('approved', true)
    .eq('active', true)

  if (managersError || !crmManagers || crmManagers.length === 0) {
    return NextResponse.json({ error: 'No active managers in CRM', imported: 0 }, { status: 400 })
  }

  // Match sheet managers to CRM managers by surname
  const matchedManagers: { sheetId: string; crmId: string; crmName: string; sheetName: string }[] = []
  const skippedManagers: string[] = []

  for (const sheetMgr of MANAGER_SHEETS) {
    const match = matchManager(crmManagers, sheetMgr.name)
    if (match) {
      matchedManagers.push({
        sheetId: sheetMgr.sheetId,
        crmId: match.id,
        crmName: match.full_name || '',
        sheetName: sheetMgr.name,
      })
    } else {
      skippedManagers.push(sheetMgr.name)
    }
  }

  if (matchedManagers.length === 0) {
    return NextResponse.json({
      error: 'No manager sheets matched CRM managers',
      skipped: skippedManagers,
      imported: 0,
    })
  }

  // Get existing phones in CRM
  const { data: existing } = await getSupabaseAdmin().from('candidates').select('phone')
  const existingPhones = new Set((existing?.map((c) => normalizePhone(c.phone)) || []).filter(Boolean))

  const allImports: {
    phone: string
    manager_id: string
    status: string
    imported_from_sheets: boolean
  }[] = []

  const allSheetUpdates: { sheetId: string; range: string; value: string }[] = []

  // Process each matched manager's sheet
  for (const mgr of matchedManagers) {
    try {
      // Read header row
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: mgr.sheetId,
        range: 'A1:Z1',
      })

      const headerRow = headerRes.data.values?.[0] || []
      if (headerRow.length === 0) continue

      let phoneIdx = headerRow.indexOf('Телефон')
      if (phoneIdx === -1) phoneIdx = 1

      let crmStatusIdx = headerRow.indexOf(CRM_STATUS_HEADER)

      // Add CRM status column if missing
      if (crmStatusIdx === -1) {
        crmStatusIdx = headerRow.length
        await sheets.spreadsheets.values.update({
          spreadsheetId: mgr.sheetId,
          range: `${colLetter(crmStatusIdx)}1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[CRM_STATUS_HEADER]] },
        })
      }

      // Read full data
      const fullRes = await sheets.spreadsheets.values.get({
        spreadsheetId: mgr.sheetId,
        range: `A1:${colLetter(crmStatusIdx)}`,
      })

      const allRows = fullRes.data.values || []
      if (allRows.length <= 1) continue

      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i]
        const rawPhone = row[phoneIdx]?.toString().trim()
        const phone = normalizePhone(rawPhone)
        const crmStatus = crmStatusIdx >= 0 ? row[crmStatusIdx]?.toString().trim() : ''

        if (!phone || crmStatus === STATUS_MARK || existingPhones.has(phone)) continue

        allImports.push({
          phone,
          manager_id: mgr.crmId,
          status: 'На обзвон',
          imported_from_sheets: true,
        })

        allSheetUpdates.push({
          sheetId: mgr.sheetId,
          range: `${colLetter(crmStatusIdx)}${i + 1}`,
          value: STATUS_MARK,
        })
      }
    } catch (err) {
      console.error(`Error reading sheet for ${mgr.sheetName}:`, err)
    }
  }

  if (allImports.length === 0) {
    return NextResponse.json({
      imported: 0,
      matched: matchedManagers.map((m) => m.sheetName),
      skipped: skippedManagers,
    })
  }

  // Insert into CRM
  const { error: insertError } = await getSupabaseAdmin().from('candidates').insert(allImports)
  if (insertError) {
    return NextResponse.json({ error: insertError.message, imported: 0 }, { status: 500 })
  }

  // Mark as taken in each sheet
  for (const sheetId of new Set(allSheetUpdates.map((u) => u.sheetId))) {
    const updates = allSheetUpdates.filter((u) => u.sheetId === sheetId)
    const updateRequests = updates.map((u) => ({
      range: u.range,
      values: [[u.value]],
    }))

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updateRequests,
      },
    })
  }

  return NextResponse.json({
    imported: allImports.length,
    matched: matchedManagers.map((m) => m.sheetName),
    skipped: skippedManagers,
  })
}