import { createClient } from '@/lib/supabase-server'
import { isForbiddenArticle } from '@/lib/forbidden-articles'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  const body = await request.json()
  const {
    age,
    citizenship,
    disease,
    drivers,
    bpla,
    relations,
    edvMin,
    edvMax,
    healthGroup,
    praetorian,
    conviction,
    convictionArticle,
    commissioned,
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
        if (healthGroup && healthGroup !== 'А') {
          mismatches.push('БПЛА требует группу здоровья А')
        } else {
          matches.push('Нужны операторы БПЛА')
        }
      }
    }

    // Relations
    if (relations && city.relations) {
      const cityRelations = city.relations.toLowerCase()
      const userRelations = relations.toLowerCase()
      if (userRelations === 'да') {
        if (cityRelations.includes('выписывают') || cityRelations.includes('принимают') || cityRelations.includes('да')) {
          matches.push('Отношения принимают/выписывают')
        } else if (cityRelations.includes('нет') || cityRelations.includes('не')) {
          mismatches.push('Отношения не работают')
        }
      } else if (userRelations === 'нет') {
        if (cityRelations.includes('нет') || cityRelations.includes('не') || cityRelations === '') {
          matches.push('Без отношений')
        } else {
          mismatches.push('Отношения есть — уточняй')
        }
      }
    }

    // EDV range
    if (edvMin || edvMax) {
      const cityEdv = parseInt(String(city.edv || '').replace(/\D/g, ''), 10)
      const min = edvMin ? parseInt(edvMin, 10) : 0
      const max = edvMax ? parseInt(edvMax, 10) : Infinity
      if (cityEdv && cityEdv >= min && cityEdv <= max) {
        matches.push(`ЕДВ ${city.edv} в диапазоне`)
      } else if (cityEdv) {
        mismatches.push(`ЕДВ ${city.edv} вне диапазона`)
      }
    }

    // Praetorian
    if (praetorian) {
      const note = (city.note || '').toLowerCase()
      if (note.includes('прапорщик')) {
        if (praetorian === 'да') {
          matches.push('Прапорщики принимаются')
        } else {
          mismatches.push('Прапорщики принимаются, а кандидат не прапорщик')
        }
      }
    }

    // Commissioned
    if (commissioned) {
      const note = (city.note || '').toLowerCase()
      if (note.includes('комисс')) {
        if (commissioned === 'да') {
          matches.push('Подходит для комиссованных')
        } else {
          mismatches.push('Есть упоминание комиссии')
        }
      }
    }

    // Conviction
    if (conviction && conviction.startsWith('yes')) {
      if (convictionArticle) {
        const articleCheck = isForbiddenArticle(convictionArticle)
        if (articleCheck.forbidden) {
          mismatches.push(`Запрещённые статьи: ${articleCheck.matched.join(', ')}`)
        } else {
          matches.push(`Судимость: статья ${convictionArticle}`)
        }
      } else {
        matches.push('Есть судимость')
      }
      // If BPLA requested but has conviction — add mismatch
      if (bpla === true) {
        mismatches.push('БПЛА недоступен при наличии судимости')
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
