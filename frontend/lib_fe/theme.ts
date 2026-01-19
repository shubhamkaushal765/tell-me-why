import {createTheme, ThemeOptions, Theme} from '@mui/material/styles'

// ============================================================================
// Color Palette
// ============================================================================

const colors = {
    primary: {
        main: '#06B6D4', // Cyan 500
        light: '#22D3EE', // Cyan 400
        dark: '#0891B2', // Cyan 600
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#0891B2', // Cyan 600
        light: '#06B6D4', // Cyan 500
        dark: '#0E7490', // Cyan 700
        contrastText: '#FFFFFF',
    },
    success: {
        main: '#10B981', // Green 500
        light: '#34D399', // Green 400
        dark: '#059669', // Green 600
    },
    error: {
        main: '#EF4444', // Red 500
        light: '#F87171', // Red 400
        dark: '#DC2626', // Red 600
    },
    warning: {
        main: '#F59E0B', // Amber 500
        light: '#FBBF24', // Amber 400
        dark: '#D97706', // Amber 600
    },
    info: {
        main: '#3B82F6', // Blue 500
        light: '#60A5FA', // Blue 400
        dark: '#2563EB', // Blue 600
    },
}

// ============================================================================
// Typography
// ============================================================================

const typography: ThemeOptions['typography'] = {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
    },
    h2: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
    },
    h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
    },
    h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
    },
    h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
    },
    h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
    },
    body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
    },
    body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
    },
    button: {
        textTransform: 'none',
        fontWeight: 500,
    },
}

// ============================================================================
// Shape & Spacing
// ============================================================================

const shape = {
    borderRadius: 8,
}

// ============================================================================
// Light Theme
// ============================================================================

const lightTheme: ThemeOptions = {
    palette: {
        mode: 'light',
        ...colors,
        background: {
            default: '#F9FAFB', // Gray 50
            paper: '#FFFFFF',
        },
        text: {
            primary: '#111827', // Gray 900
            secondary: '#6B7280', // Gray 500
            disabled: '#9CA3AF', // Gray 400
        },
        divider: '#E5E7EB', // Gray 200
    },
    typography,
    shape,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 16px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
                },
                elevation2: {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                },
            },
        },
    },
}

// ============================================================================
// Dark Theme
// ============================================================================

const darkTheme: ThemeOptions = {
    palette: {
        mode: 'dark',
        ...colors,
        background: {
            default: '#0F172A', // Slate 900
            paper: '#1E293B', // Slate 800
        },
        text: {
            primary: '#F1F5F9', // Slate 100
            secondary: '#94A3B8', // Slate 400
            disabled: '#64748B', // Slate 500
        },
        divider: '#334155', // Slate 700
    },
    typography,
    shape,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 16px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                contained: {
                    '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        '& fieldset': {
                            borderColor: '#475569', // Slate 600
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
                },
                elevation2: {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
                    backgroundColor: '#1E293B', // Slate 800
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                },
            },
        },
    },
}

// ============================================================================
// Theme Creator
// ============================================================================

export function createAppTheme(mode: 'light' | 'dark'): Theme {
    const themeOptions = mode === 'dark' ? darkTheme : lightTheme
    return createTheme(themeOptions)
}