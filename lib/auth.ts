import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { query } from './db'
import { cookies } from 'next/headers'

const AUTH_COOKIE = 'crm-auth-token'
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production')

export interface User {
  id: string
  email?: string | null
  full_name?: string | null
  role: string
  approved: boolean
  active: boolean
  avatar_url?: string | null
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string, full_name?: string) {
  const hash = await hashPassword(password)
  const result = await query(
    `INSERT INTO profiles (email, password_hash, full_name, role, approved, active)
     VALUES ($1, $2, $3, 'manager', false, true)
     RETURNING id`,
    [email, hash, full_name || email]
  )
  return result.rows[0]?.id
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, full_name, role, approved, active, avatar_url
     FROM profiles WHERE email = $1 LIMIT 1`,
    [email]
  )
  return result.rows[0] || null
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query(
    `SELECT id, email, full_name, role, approved, active, avatar_url
     FROM profiles WHERE id = $1 LIMIT 1`,
    [id]
  )
  return result.rows[0] || null
}

export async function signToken(user: User) {
  return new SignJWT({ id: user.id, role: user.role, approved: user.approved, active: user.active })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; role: string; approved: boolean; active: boolean }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getUser() {
  const session = await getSession()
  if (!session) return null
  return findUserById(session.id)
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
}

export { AUTH_COOKIE }
