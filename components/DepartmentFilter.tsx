'use client'

import { useEffect, useState } from 'react'

interface Department {
  id: string
  name: string
}

interface DepartmentFilterProps {
  value?: string
  onChange: (departmentId: string | undefined) => void
}

export function DepartmentFilter({ value, onChange }: DepartmentFilterProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/departments')
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new Error(data.error || `HTTP ${r.status}`)
        }
        return r.json()
      })
      .then((data) => {
        setDepartments(data || [])
        setError('')
      })
      .catch((e) => {
        console.error('[DepartmentFilter] failed to load departments', e)
        setError('')
      })
  }, [])

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="border rounded-lg px-3 py-2 text-sm"
    >
      <option value="">Все отделы</option>
      {departments.map((d) => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>
  )
}
