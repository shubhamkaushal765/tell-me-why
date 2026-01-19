'use client'

import {useState, useMemo, createContext, useContext, ReactNode, useEffect} from 'react'
import {ThemeProvider} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter'
import {createAppTheme} from '@/lib_fe/theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
    mode: ThemeMode
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useThemeMode = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useThemeMode must be used within ThemeRegistry')
    }
    return context
}

export default function ThemeRegistry({children}: { children: ReactNode }) {
    // Always start with 'light' for both server and client
    const [mode, setMode] = useState<ThemeMode>('light')
    const [mounted, setMounted] = useState(false)

    // After mount, read from localStorage and update if needed
    useEffect(() => {
        setMounted(true)

        // Check localStorage first
        const stored = localStorage.getItem('theme-mode') as ThemeMode | null
        if (stored) {
            setMode(stored)
            return
        }

        // Fall back to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setMode('dark')
        }
    }, [])

    const theme = useMemo(() => createAppTheme(mode), [mode])

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light'
            localStorage.setItem('theme-mode', newMode)
            return newMode
        })
    }

    const contextValue = useMemo(
        () => ({
            mode,
            toggleTheme,
        }),
        [mode]
    )

    return (
        <AppRouterCacheProvider options={{enableCssLayer: true}}>
            <ThemeContext.Provider value={contextValue}>
                <ThemeProvider theme={theme}>
                    <CssBaseline/>
                    {children}
                </ThemeProvider>
            </ThemeContext.Provider>
        </AppRouterCacheProvider>
    )
}