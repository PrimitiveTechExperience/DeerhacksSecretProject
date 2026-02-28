"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/auth/auth-provider"
import { AUTH_PROVIDER } from "@/lib/auth/config"

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signup(name, email, password)
      router.push("/learn")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border/40 px-4 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </Button>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4 py-8">
        {AUTH_PROVIDER === "auth0" ? (
          <div className="w-full space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <h1 className="font-display text-2xl font-bold">Sign Up</h1>
            <p className="text-sm text-muted-foreground">Create your account with Auth0 Universal Signup.</p>
            <Button asChild className="w-full btn-smooth">
              <a href="/api/auth/signup">Sign up with Auth0</a>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account? <a href="/api/auth/login" className="text-primary hover:underline">Login with Auth0</a>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="w-full space-y-4 rounded-xl border border-border/50 bg-card p-6">
            <h1 className="font-display text-2xl font-bold">Sign Up</h1>
            <p className="text-sm text-muted-foreground">Create a local account now, migrate to Auth0 later.</p>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full btn-smooth" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
