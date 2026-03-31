import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister } from '@/services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'flashcard_token'
const USER_KEY = 'flashcard_user'

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY)
      const u = localStorage.getItem(USER_KEY)
      if (t && u) {
        setToken(t)
        setUser(JSON.parse(u))
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } finally {
      setReady(true)
    }
  }, [])

  const persistSession = useCallback((t, u) => {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const data = await apiLogin(email, password)
      persistSession(data.token, data.user)
      navigate('/dashboard', { replace: true })
    },
    [navigate, persistSession]
  )

  const register = useCallback(
    async (email, password) => {
      const data = await apiRegister(email, password)
      persistSession(data.token, data.user)
      navigate('/dashboard', { replace: true })
    },
    [navigate, persistSession]
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login,
      register,
      logout,
    }),
    [token, user, ready, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
