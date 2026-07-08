'use client'

import { useTransition } from 'react'

interface Department {
  id: string
  name: string
}

interface ManagerDepartmentSelectProps {
  userId: string
  departmentId?: string | null
  departments: Department[]
}

export function ManagerDepartmentSelect({ userId, departmentId, departments }: ManagerDepartmentSelectProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action="/api/admin/assign-department"
      method="POST"
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        startTransition(() => {
          fetch('/api/admin/assign-department', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              departmentId: formData.get('departmentId') || null,
            }),
          }).then(() => {
            window.location.reload()
          })
        })
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <select
        name="departmentId"
        defaultValue={departmentId || ''}
        disabled={isPending}
        className="text-sm border rounded px-2 py-1 disabled:opacity-50"
        onChange={(e) => {
          e.target.form?.requestSubmit()
        }}
      >
        <option value="">Без отдела</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </form>
  )
}
