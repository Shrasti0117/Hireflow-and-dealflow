import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import apiClient, { setCsrfToken } from '../api/apiClient.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const authOperation = useRef(0)

  useEffect(() => {
    let active = true
    const operationAtStart = authOperation.current

    async function restoreSession() {
      try {
        const { data } = await apiClient.get('/auth/me')
        if (!data?.data?.id) throw new Error('Invalid session response.')
        const csrfResponse = await apiClient.get('/auth/csrf')
        if (typeof csrfResponse.data?.data?.csrfToken !== 'string') {
          throw new Error('Invalid CSRF response.')
        }
        if (!active || operationAtStart !== authOperation.current) return
        setCsrfToken(csrfResponse.data.data.csrfToken)
        setUser(data.data)
        setStatus('authenticated')
      } catch {
        if (!active || operationAtStart !== authOperation.current) return
        setCsrfToken(null)
        setUser(null)
        setStatus('unauthenticated')
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url
        if (
          error.response?.status === 401
          && url !== '/auth/login'
          && !url?.endsWith('/auth/login')
        ) {
          authOperation.current += 1
          setCsrfToken(null)
          setUser(null)
          setStatus('unauthenticated')
        }

        return Promise.reject(error)
      },
    )

    return () => apiClient.interceptors.response.eject(interceptorId)
  }, [])

  const login = useCallback(async (email, password) => {
    authOperation.current += 1
    setCsrfToken(null)
    const { data } = await apiClient.post('/auth/login', { email, password })
    const authenticatedUser = data?.data
    if (!authenticatedUser?.id) {
      throw new Error('The login response did not include a valid user.')
    }

    const csrfResponse = await apiClient.get('/auth/csrf')
    if (typeof csrfResponse.data?.data?.csrfToken !== 'string') {
      throw new Error('The session security response was invalid.')
    }

    setCsrfToken(csrfResponse.data.data.csrfToken)
    setUser(authenticatedUser)
    setStatus('authenticated')
    return authenticatedUser
  }, [])

  const register = useCallback(async (name, email, password) => {
    await apiClient.post('/auth/register', { name, email, password })
    return login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    authOperation.current += 1
    await apiClient.post('/auth/logout')
    setCsrfToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(() => ({
    user,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    register,
    logout,
  }), [user, status, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider.')
  return context
}

export { AuthProvider, useAuth }