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
            playerProfile: true,
          },
        })

        // If not found, try to find by playerId
        if (!user) {
          const playerProfile = await prisma.masterPlayer.findUnique({
            where: { playerId: identifier },
            include: { user: true },
          })
          if (playerProfile) {
            user = playerProfile.user
            user.playerProfile = playerProfile
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
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          photo: user.photo,
          role: user.role,
          playerId: user.playerProfile?.playerId || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.mobile = user.mobile
        token.photo = user.photo
        token.playerId = user.playerId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.mobile = token.mobile
        session.user.photo = token.photo
        session.user.playerId = token.playerId
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
