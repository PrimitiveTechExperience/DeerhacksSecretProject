"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { authClient } from "@/lib/auth/client"
import type { AuthSession, AuthUser } from "@/lib/auth/types"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>({ user: null })
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const next = await authClient.getSession()
      setSession(next)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      loading,
      refresh,
      login: async (email, password) => {
        setLoading(true)
        try {
          const next = await authClient.login(email, password)
          setSession(next)
        } finally {
          setLoading(false)
        }
      },
      signup: async (name, email, password) => {
        setLoading(true)
        try {
          const next = await authClient.signup(name, email, password)
          setSession(next)
        } finally {
          setLoading(false)
        }
      },
      logout: async () => {
        setLoading(true)
        try {
          await authClient.logout()
          setSession({ user: null })
        } finally {
          setLoading(false)
        }
      },
    }),
    [loading, session.user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

