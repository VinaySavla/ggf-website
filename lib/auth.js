import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ROLES } from '@/lib/roles'
import { checkRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import { authSecret } from '@/lib/secrets'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email/Mobile/PlayerID', type: 'text' },
        password: { label: 'Password', type: 'password' },
        code: { label: 'One-time code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || (!credentials?.password && !credentials?.code)) {
          throw new Error('Please provide your identifier and password or sign-in code')
        }

        const identifier = String(credentials.identifier).trim()
        const normalizedIdentifier = identifier.includes('@') ? identifier.toLowerCase() : identifier
        await checkRateLimit('login', normalizedIdentifier, 8, 15 * 60 * 1000)

        // Find user by email, mobile, or playerId
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: normalizedIdentifier, mode: 'insensitive' } },
              { mobile: normalizedIdentifier },
            ],
          },
          include: {
            userProfile: true,
          },
        })

        // If not found, try to find by playerId
        if (!user) {
          const userProfile = await prisma.masterPlayer.findUnique({
            where: { playerId: normalizedIdentifier },
            include: { user: true },
          })
          if (userProfile) {
            user = userProfile.user
            user.userProfile = userProfile
          }
        }

        if (!user) {
          throw new Error('Invalid sign-in details')
        }

        if (!user.isActive) {
          throw new Error('Invalid sign-in details')
        }

        if (credentials.code) {
          const record = await prisma.loginCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
          const submittedHash = crypto.createHmac('sha256', authSecret()).update(String(credentials.code).trim()).digest('hex')
          const valid = record && record.expiresAt > new Date() && record.attempts < 5 && crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(submittedHash))
          if (!valid) {
            if (record) await prisma.loginCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
            throw new Error('Invalid or expired sign-in code')
          }
          await prisma.loginCode.deleteMany({ where: { userId: user.id } })
        } else {
          const isPasswordValid = await bcrypt.compare(String(credentials.password), user.password)
          if (!isPasswordValid) throw new Error('Invalid sign-in details')
        }

        return {
          id: user.id,
          firstName: user.firstName,
          middleName: user.middleName,
          surname: user.surname,
          name: `${user.firstName} ${user.middleName} ${user.surname}`, // Keep full name for compatibility
          email: user.email,
          mobile: user.mobile,
          photo: user.photo,
          gender: user.gender,
          role: user.role,
          memberId: user.userProfile?.playerId || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.firstName = user.firstName
        token.middleName = user.middleName
        token.surname = user.surname
        token.name = `${user.firstName} ${user.middleName} ${user.surname}` // Full name for display
        token.role = user.role === 'PLAYER' ? ROLES.USER : user.role
        token.mobile = user.mobile
        token.photo = user.photo
        token.gender = user.gender
        token.memberId = user.memberId
      }
      if (token.id && !user) {
        const current = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true, isActive: true } })
        token.role = current?.role === 'PLAYER' ? ROLES.USER : current?.role
        token.isActive = Boolean(current?.isActive)
      } else if (user) {
        token.isActive = true
      }
      
      // Handle session updates from client (e.g., after profile update)
      if (trigger === "update" && session) {
        if (session.firstName !== undefined) token.firstName = session.firstName
        if (session.middleName !== undefined) token.middleName = session.middleName
        if (session.surname !== undefined) token.surname = session.surname
        if (session.firstName !== undefined || session.middleName !== undefined || session.surname !== undefined) {
          token.name = `${session.firstName || token.firstName} ${session.middleName || token.middleName} ${session.surname || token.surname}`
        }
        if (session.gender !== undefined) token.gender = session.gender
        if (session.photo !== undefined) token.photo = session.photo
        if (session.mobile !== undefined) token.mobile = session.mobile
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.firstName = token.firstName
        session.user.middleName = token.middleName
        session.user.surname = token.surname
        session.user.name = token.name // Full name for display
        session.user.role = token.role
        session.user.mobile = token.mobile
        session.user.photo = token.photo
        session.user.gender = token.gender
        session.user.memberId = token.memberId
        session.user.isActive = token.isActive !== false
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: authSecret(),
})
