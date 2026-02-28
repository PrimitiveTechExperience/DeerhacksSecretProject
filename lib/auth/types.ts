export interface AuthUser {
  id: string
  email: string
  name: string
  provider: "local" | "auth0"
}

export interface AuthSession {
  user: AuthUser | null
}

export interface AuthAdapter {
  getSession: () => Promise<AuthSession>
  login: (email: string, password: string) => Promise<AuthSession>
  signup: (name: string, email: string, password: string) => Promise<AuthSession>
  logout: () => Promise<void>
}

