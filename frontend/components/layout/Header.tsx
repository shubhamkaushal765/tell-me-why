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
} from '@mui/material'
import {
    Brightness4,
    Brightness7,
    Settings,
    Info,
    Delete,
    Download,

} from '@mui/icons-material'
import {useThemeMode} from '../ThemeRegistry'
import {useChat} from '@/hooks/useChat'
import {apiClient} from '@/lib/api'
import {StatsResponse} from '@/lib/types'
import {exportChatAsMarkdown, downloadAsFile} from '@/lib/utils'
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
            }}
        >
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #06B6D4 30%, #0891B2 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Tell Me Why
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    {/* Message count */}
                    {messages.length > 0 && (
                        <Chip
                            label={`${messages.length} messages`}
                            size="small"
                            variant="outlined"
                        />
                    )}

                    {/* Theme toggle */}
                    <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                        <IconButton onClick={toggleTheme} color="inherit">
                            {mode === 'dark' ? <Brightness7/> : <Brightness4/>}
                        </IconButton>
                    </Tooltip>

                    {/* Settings menu */}
                    <Tooltip title="Settings">
                        <IconButton onClick={handleMenuOpen} color="inherit">
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
                            sx: {minWidth: 280, mt: 1},
                        }}
                    >
                        {/* Stats section */}
                        <MenuItem disabled>
                            <ListItemIcon>
                                <Info fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText primary="System Info"/>
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
                                    />
                                </MenuItem>
                                <MenuItem disabled>
                                    <ListItemText
                                        secondary={`Default LLM: ${stats.llm.default}`}
                                    />
                                </MenuItem>
                                <MenuItem disabled>
                                    <ListItemText
                                        secondary={`Claude ${stats.llm.claude_available ? '✓' : '✗'}`}
                                    />
                                </MenuItem>
                            </>
                        ) : null}

                        <Divider sx={{my: 1}}/>

                        {/* Actions */}
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