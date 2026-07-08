'use client'

import { useEffect, useState } from 'react'

interface Department {
  id: string
  name: string
}

interface DepartmentFilterProps {
  value?: string
  onChange: (departmentId: string | undefined) => void
  departments?: { id: string; name: string }[]
}

export function DepartmentFilter({ value, onChange, departments: departmentsProp }: DepartmentFilterProps) {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>(departmentsProp || [])

  useEffect(() => {
    if (departmentsProp) {
      setDepartments(departmentsProp)
      return
    }
    fetch('/api/admin/departments')
      .then((r) => r.json())
      .then((data) => setDepartments(data || []))
      .catch((e) => console.error('[DepartmentFilter] failed to load', e))
  }, [departmentsProp])

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
