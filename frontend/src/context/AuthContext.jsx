import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })
    const [token, setToken] = useState(() => localStorage.getItem('token'))

    const login = (userData, tokenData) => {
        setUser(userData)
        setToken(tokenData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', tokenData)
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
    }

    const updateCredits = (credits) => {
        const updated = { ...user, sms_credits: credits }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateCredits }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)