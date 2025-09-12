"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignIn() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      // Redirect based on user role
      if (!session.user.role) {
        router.push("/role-selection")
        return
      }
      if (session.user.role === "SELLER") {
        router.push("/seller/dashboard")
      } else {
        router.push("/buyer/appointments")
      }
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
