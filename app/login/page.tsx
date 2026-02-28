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

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      router.push("/learn")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
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
        <form onSubmit={onSubmit} className="w-full space-y-4 rounded-xl border border-border/50 bg-card p-6">
          <h1 className="font-display text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground">Use local auth now. Swap provider to Auth0 later.</p>

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
            {loading ? "Signing in..." : "Login"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Need an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </form>
      </main>
    </div>
  )
}

