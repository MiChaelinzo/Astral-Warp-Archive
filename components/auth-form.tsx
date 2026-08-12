"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { signUp, logIn, type AuthState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles } from "lucide-react"

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full font-medium" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {label}
    </Button>
  )
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "signup" ? signUp : logIn
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "signup" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Trailblazer name</Label>
          <Input id="displayName" name="displayName" placeholder="Stelle" autoComplete="nickname" required />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@astralexpress.com" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </div>

      {mode === "signup" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="uid">
            In-game UID <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input id="uid" name="uid" placeholder="700000000" inputMode="numeric" />
        </div>
      )}

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton label={mode === "signup" ? "Create account" : "Sign in"} />

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already aboard?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New trailblazer?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
