import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email/Mobile/PlayerID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please provide identifier and password')
        }

        const identifier = credentials.identifier

        // Find user by email, mobile, or playerId
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { mobile: identifier },
            ],
          },
          include: {
            userProfile: true,
          },
        })

        // If not found, try to find by playerId
        if (!user) {
          const userProfile = await prisma.masterPlayer.findUnique({
            where: { playerId: identifier },
            include: { user: true },
          })
          if (userProfile) {
            user = userProfile.user
            user.userProfile = userProfile
          }
        }

        if (!user) {
          throw new Error('No account found with this identifier')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
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
        token.name = user.name // Full name for display
        token.role = user.role
        token.mobile = user.mobile
        token.photo = user.photo
        token.gender = user.gender
        token.memberId = user.memberId
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
  secret: process.env.AUTH_SECRET,
})
