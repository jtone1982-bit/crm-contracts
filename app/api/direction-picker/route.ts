import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const body = await request.json()
  const {
    age,
    citizenship,
    disease,
    drivers,
    bpla,
    vvk,
  } = body

  // Load raw selection data from training_modules content
  const { data: module } = await supabase
    .from('training_modules')
    .select('content')
    .eq('slug', 'selection')
    .single()

  const cities = (module?.content || []).filter((item: any) => item.type === 'selection')

  let results = cities.map((city: any) => {
    const matches: string[] = []
    const mismatches: string[] = []

    // Age
    if (age && city.age) {
      const range = city.age.match(/(\d+).*-.*(\d+)/)
      if (range) {
        const min = parseInt(range[1], 10)
        const max = parseInt(range[2], 10)
        const userAge = parseInt(age, 10)
        if (userAge >= min && userAge <= max) {
          matches.push(`Возраст ${userAge} подходит (${city.age})`)
        } else {
          mismatches.push(`Возраст ${userAge} не подходит (${city.age})`)
        }
      }
    }

    // Citizenship
    if (citizenship && city.foreign) {
      const cityText = city.foreign.toLowerCase()
      const userText = citizenship.toLowerCase()
      if (
        (userText.includes('снг') && cityText.includes('снг')) ||
        (userText.includes('иностран') && (cityText.includes('иностран') || cityText.includes('снг'))) ||
        (userText.includes('рф') && !cityText)
      ) {
        matches.push(`Гражданство: ${citizenship}`)
      } else if (cityText.includes('снг') || cityText.includes('иностран')) {
        mismatches.push(`Гражданство: ${citizenship} — уточняй`)
      }
    }

    // Disease
    if (disease && city.diseases) {
      const cityDiseases = city.diseases.toLowerCase()
      const userDisease = disease.toLowerCase()
      if (cityDiseases.includes(userDisease)) {
        matches.push(`Принимают с ${disease}`)
      } else {
        mismatches.push(`С ${disease} не принимают`)
      }
    }

    // Drivers
    if (drivers === true && city.drivers) {
      if (city.drivers.toLowerCase() !== 'нет') {
        matches.push('Нужны водители')
      }
    }

    // BPLA
    if (bpla === true && city.bpla) {
      if (city.bpla.toLowerCase().includes('да')) {
        matches.push('Нужны операторы БПЛА')
      }
    }

    // VVK strictness
    if (vvk && city.vvk) {
      if (city.vvk.toLowerCase().includes(vvk.toLowerCase())) {
        matches.push(`ВВК ${city.vvk}`)
      }
    }

    const score = matches.length - mismatches.length * 0.5
    return { ...city, matches, mismatches, score }
  })

  // Sort: active first, then by score
  results = results
    .filter((r: any) => r.status?.toLowerCase() !== 'стоп')
    .sort((a: any, b: any) => b.score - a.score)

  return NextResponse.json({ results: results.slice(0, 12) })
}
