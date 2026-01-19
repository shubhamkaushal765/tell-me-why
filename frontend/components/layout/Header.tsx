'use client'

import {useState} from 'react'
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Tooltip,
    Menu,
    MenuItem,
    Chip,
    Divider,
    ListItemIcon,
    ListItemText,
    alpha,
} from '@mui/material'
import {
    Brightness4,
    Brightness7,
    Settings,
    Info,
    Delete,
    Download,
    Code,
} from '@mui/icons-material'
import {useThemeMode} from '../ThemeRegistry'
import {useChat} from '@/hooks/useChat'
import {apiClient} from '@/lib_fe/api'
import {StatsResponse} from '@/lib_fe/types'
import {exportChatAsMarkdown, downloadAsFile} from '@/lib_fe/utils'
import {useSnackbar} from 'notistack'

export default function Header() {
    const {mode, toggleTheme} = useThemeMode()
    const {messages, clearMessages} = useChat()
    const {enqueueSnackbar} = useSnackbar()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [stats, setStats] = useState<StatsResponse | null>(null)
    const [statsLoading, setStatsLoading] = useState(false)

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
        fetchStats()
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const fetchStats = async () => {
        setStatsLoading(true)
        try {
            const data = await apiClient.getStats()
            setStats(data)
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setStatsLoading(false)
        }
    }

    const handleClearChat = () => {
        if (window.confirm('Are you sure you want to clear all messages?')) {
            clearMessages()
            enqueueSnackbar('Chat history cleared', {variant: 'success'})
            handleMenuClose()
        }
    }

    const handleExport = () => {
        if (messages.length === 0) {
            enqueueSnackbar('No messages to export', {variant: 'warning'})
            return
        }

        const markdown = exportChatAsMarkdown(messages)
        const filename = `tmw-chat-${new Date().toISOString().split('T')[0]}.md`
        downloadAsFile(markdown, filename)
        enqueueSnackbar('Chat exported successfully', {variant: 'success'})
        handleMenuClose()
    }

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                backgroundColor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(8px)',
            }}
        >
            <Toolbar sx={{minHeight: {xs: 64, sm: 72}, px: {xs: 2, sm: 3}}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        }}
                    >
                        <Code sx={{color: 'white', fontSize: 24}}/>
                    </Box>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                fontSize: {xs: '1.125rem', sm: '1.25rem'},
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                lineHeight: 1.2,
                            }}
                        >
                            Tell Me Why
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                            }}
                        >
                            RAG Code Assistant
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{flexGrow: 1}}/>

                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    {messages.length > 0 && (
                        <Chip
                            label={`${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`}
                            size="small"
                            sx={{
                                display: {xs: 'none', sm: 'flex'},
                                height: 28,
                                fontWeight: 600,
                                backgroundColor: alpha(mode === 'light' ? '#2563eb' : '#3b82f6', 0.1),
                                color: mode === 'light' ? '#2563eb' : '#3b82f6',
                                border: 'none',
                            }}
                        />
                    )}

                    <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                color: 'text.primary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    transform: 'scale(1.05)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {mode === 'dark' ? <Brightness7/> : <Brightness4/>}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Settings">
                        <IconButton
                            onClick={handleMenuOpen}
                            sx={{
                                color: 'text.primary',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    transform: 'scale(1.05)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Settings/>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        transformOrigin={{horizontal: 'right', vertical: 'top'}}
                        anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                        PaperProps={{
                            sx: {
                                minWidth: 280,
                                mt: 1.5,
                                borderRadius: 2,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                            },
                        }}
                    >
                        <MenuItem disabled>
                            <ListItemIcon>
                                <Info fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText
                                primary="System Info"
                                primaryTypographyProps={{fontWeight: 600}}
                            />
                        </MenuItem>

                        {statsLoading ? (
                            <MenuItem disabled>
                                <ListItemText secondary="Loading..."/>
                            </MenuItem>
                        ) : stats ? (
                            <>
                                <MenuItem disabled>
                                    <ListItemText
                                        secondary={`Documents: ${stats.vector_store.total_documents}`}
                                        secondaryTypographyProps={{fontSize: '0.875rem'}}
                                    />
                                </MenuItem>
                                <MenuItem disabled>
                                    <ListItemText
                                        secondary={`Default LLM: ${stats.llm.default}`}
                                        secondaryTypographyProps={{fontSize: '0.875rem'}}
                                    />
                                </MenuItem>
                                <MenuItem disabled>
                                    <ListItemText
                                        secondary={`Claude ${stats.llm.claude_available ? '✓' : '✗'}`}
                                        secondaryTypographyProps={{fontSize: '0.875rem'}}
                                    />
                                </MenuItem>
                            </>
                        ) : null}

                        <Divider sx={{my: 1}}/>

                        <MenuItem onClick={handleExport} disabled={messages.length === 0}>
                            <ListItemIcon>
                                <Download fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText primary="Export Chat"/>
                        </MenuItem>

                        <MenuItem onClick={handleClearChat} disabled={messages.length === 0}>
                            <ListItemIcon>
                                <Delete fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText primary="Clear Chat"/>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    )
}