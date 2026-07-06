import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ imported: 0 })
    }

    // Find phone column or use first column
    const headers = rows[0].map((h) => String(h).toLowerCase().trim())
    let phoneIdx = headers.findIndex((h) => h.includes('телефон') || h.includes('phone') || h.includes('номер'))
    if (phoneIdx === -1) phoneIdx = 0

    const phones: string[] = []
    for (let i = 1; i < rows.length; i++) {
      const raw = rows[i][phoneIdx]
      if (!raw) continue
      const phone = String(raw).trim()
      if (phone) phones.push(phone)
    }

    if (phones.length === 0) {
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
    const existingPhones = new Set(existing?.map((c) => c.phone) || [])

    const newPhones = phones.filter((p) => !existingPhones.has(p))

    if (newPhones.length === 0) {
      return NextResponse.json({ imported: 0, duplicates: phones.length })
    }

    const imports = newPhones.map((phone, idx) => ({
      phone,
      manager_id: managers[idx % managers.length].id,
      status: 'На обзвон',
      imported_from_sheets: false,
    }))

    const { error: insertError } = await getSupabaseAdmin().from('candidates').insert(imports)
    if (insertError) {
      return NextResponse.json({ error: insertError.message, imported: 0 }, { status: 500 })
    }

    return NextResponse.json({ imported: imports.length, duplicates: phones.length - newPhones.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import failed', imported: 0 }, { status: 500 })
  }
}
