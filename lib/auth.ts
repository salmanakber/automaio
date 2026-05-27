import { hash, compare } from 'bcryptjs'
import { prisma } from './prisma'
import crypto from 'crypto'

const SALT_ROUNDS = 10
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { token } })
    }
    return null
  }

  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => {})
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function signUp(email: string, password: string, firstName?: string, lastName?: string) {
  const normalizedEmail = normalizeEmail(email)
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  
  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
    },
  })

  return user
}

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } })
  
  if (!user) {
    throw new Error('Invalid credentials')
  }

  if (!user.password) {
    throw new Error('This account uses Google sign-in. Click Continue with Google.')
  }

  const passwordValid = await verifyPassword(password, user.password)
  
  if (!passwordValid) {
    throw new Error('Invalid credentials')
  }

  return user
}

// Alias for API route usage
export async function verifySession(req: {
  cookies?: { get: (name: string) => { value: string } | undefined }
  headers?: { get: (name: string) => string | null }
}) {
  const token =
    req.cookies?.get('auth_token')?.value ??
    req.headers?.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return validateSession(token)
}
