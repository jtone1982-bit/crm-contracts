import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/guards'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { user: adminUser } = await requireAdmin()
  const adminClient = createAdminClient()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, transferToManagerId } = body

  if (!userId) {
    return NextResponse.json({ error: 'Не выбран пользователь' }, { status: 400 })
  }

  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 403 })
  }

  // Get target user profile
  const { data: targetProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', userId)
    .single()

  if (profileError || !targetProfile) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
  }

  if (targetProfile.role === 'admin') {
    // Check if this is the last admin
    const { count } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if (count === 1) {
      return NextResponse.json({ error: 'Нельзя удалить единственного администратора' }, { status: 403 })
    }
  }

  // Count candidates
  const { count: candidatesCount } = await adminClient
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('manager_id', userId)

  // Transfer candidates if needed
  if (candidatesCount && candidatesCount > 0) {
    if (!transferToManagerId) {
      return NextResponse.json({ error: 'Укажите менеджера для переноса кандидатов' }, { status: 400 })
    }

    const { data: targetManager } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', transferToManagerId)
      .in('role', ['manager', 'admin'])
      .single()

    if (!targetManager) {
      return NextResponse.json({ error: 'Целевой менеджер не найден' }, { status: 404 })
    }

    const { error: transferError } = await adminClient
      .from('candidates')
      .update({ manager_id: transferToManagerId })
      .eq('manager_id', userId)

    if (transferError) {
      return NextResponse.json({ error: `Ошибка переноса кандидатов: ${transferError.message}` }, { status: 500 })
    }
  }

  // Delete related data
  const tablesToClean = [
    'training_progress',
    'training_attempts',
    'messages',
    'candidate_notes',
    'contacts',
    'activity_logs',
  ]

  for (const table of tablesToClean) {
    try {
      await adminClient.from(table).delete().eq('user_id', userId)
    } catch (e) {
      // Column may not exist in some tables, ignore
    }
  }

  // Try to delete messages where user is receiver
  try {
    await adminClient.from('messages').delete().eq('receiver_id', userId)
  } catch (e) {
    // ignore
  }

  // Delete profile
  const { error: deleteProfileError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (deleteProfileError) {
    return NextResponse.json({ error: `Ошибка удаления профиля: ${deleteProfileError.message}` }, { status: 500 })
  }

  // Delete auth user
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteAuthError) {
    return NextResponse.json({ error: `Ошибка удаления авторизации: ${deleteAuthError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    deleted: true,
    transferred: candidatesCount || 0,
  })
}
