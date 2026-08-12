import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { AuthForm } from "@/components/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrainFront } from "lucide-react"

export default async function SignupPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <main className="starfield flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-foreground">
        <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrainFront className="size-5" />
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">Astral Warp Archive</span>
      </Link>

      <Card className="w-full max-w-sm border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Begin your journey</CardTitle>
          <CardDescription>Create an account to log warps and join the leaderboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="signup" />
        </CardContent>
      </Card>
    </main>
  )
}
