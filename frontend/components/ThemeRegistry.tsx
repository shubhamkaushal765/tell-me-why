'use client'

import {
    useState,
    useMemo,
    createContext,
    useContext,
    ReactNode,
    useEffect
} from 'react'
import {ThemeProvider, createTheme} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter'

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

const createAppTheme = (mode: ThemeMode) => createTheme({
    palette: {
        mode,
        ...(mode === 'light' ? {
            primary: {
                main: '#2563eb',
                light: '#3b82f6',
                dark: '#1d4ed8',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#7c3aed',
                light: '#8b5cf6',
                dark: '#6d28d9',
            },
            background: {
                default: '#f8fafc',
                paper: '#ffffff',
            },
            text: {
                primary: '#0f172a',
                secondary: '#64748b',
            },
            divider: '#e2e8f0',
            action: {
                hover: 'rgba(37, 99, 235, 0.04)',
                selected: 'rgba(37, 99, 235, 0.08)',
            },
        } : {
            primary: {
                main: '#3b82f6',
                light: '#60a5fa',
                dark: '#2563eb',
                contrastText: '#ffffff',
            },
            secondary: {
                main: '#8b5cf6',
                light: '#a78bfa',
                dark: '#7c3aed',
            },
            background: {
                default: '#0f172a',
                paper: '#1e293b',
            },
            text: {
                primary: '#f1f5f9',
                secondary: '#94a3b8',
            },
            divider: '#334155',
            action: {
                hover: 'rgba(59, 130, 246, 0.08)',
                selected: 'rgba(59, 130, 246, 0.12)',
            },
        }),
    },
    typography: {
        fontFamily: '"DM Sans", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
        h1: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h4: {
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
        },
        body1: {
            lineHeight: 1.7,
        },
        body2: {
            lineHeight: 1.6,
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: mode === 'light' ? '#f1f5f9' : '#1e293b',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: mode === 'light' ? '#cbd5e1' : '#475569',
                        borderRadius: '4px',
                        '&:hover': {
                            background: mode === 'light' ? '#94a3b8' : '#64748b',
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation0: {
                    boxShadow: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    height: 28,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s ease',
                },
            },
        },
    },
})

export default function ThemeRegistry({children}: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('light')
    const [, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem('theme-mode') as ThemeMode | null
        if (stored) {
            setMode(stored)
            return
        }
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