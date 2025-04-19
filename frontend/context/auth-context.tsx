"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  login: string
  avatar_url: string
  name: string | null
} | null

type AuthContextType = {
  user: User
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async (): Promise<boolean> => {
    try {
      // The session cookie is automatically sent with this request
      // due to the credentials: "include" option
      const response = await fetch("http://localhost:8000/api/v1/github/profile", {
        credentials: "include" // This ensures cookies are sent with the request
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call the backend logout endpoint which will clear the session
      await fetch("http://localhost:8000/api/v1/auth/logout", {
        credentials: "include"
      })
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Check authentication status when the component mounts
  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}