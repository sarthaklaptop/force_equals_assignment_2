import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: [
            "openid",
            "email", 
            "profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly"
          ].join(" "),
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: (user as any).role || null
          }
        }
      }
      // Ensure role is populated after first-time selection
      if (token?.user?.id && !token.user.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.user.id },
            select: { role: true }
          })
          if (dbUser?.role) {
            token.user.role = dbUser.role as any
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        user: {
          ...session.user,
          id: token.user?.id,
          role: token.user?.role || null
        }
      }
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user
            existingUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                googleId: profile?.sub,
                role: null
              }
            })
          } else if (!existingUser.googleId) {
            // Update existing user with Google ID
            existingUser = await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: profile?.sub }
            })
          }

          // Store refresh token if available
          if (account.refresh_token && existingUser) {
            await prisma.refreshToken.upsert({
              where: { userId: existingUser.id },
              update: {
                token: account.refresh_token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
              },
              create: {
                token: account.refresh_token,
                userId: existingUser.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              }
            })
          }

          return true
        } catch (error) {
          console.error("Error during sign in:", error)
          return false
        }
      }
      return true
    }
  },
  events: {
    async signIn({ user }) {
      // no-op for now
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt"
  }
}
