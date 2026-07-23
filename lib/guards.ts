import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  return { supabase, user }
}

export async function requireRole(allowedRoles: string[]) {
  const { supabase, user } = await requireAuth()
  const { data: profile } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single()
  if (!profile?.approved) redirect('/pending')
  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === 'student') redirect('/training')
    redirect('/')
  }
  return { supabase, user, profile }
}

export async function requireAdmin() {
  return requireRole(['admin'])
}

export async function requireManagerOrAdmin() {
  return requireRole(['admin', 'manager'])
}

export async function requireStudentOrAdmin() {
  return requireRole(['admin', 'student'])
}
