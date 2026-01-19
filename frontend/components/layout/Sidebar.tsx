'use client'

import {useState} from 'react'
import {
    Drawer,
    Box,
    Tabs,
    Tab,
    IconButton,
    Typography,
} from '@mui/material'
import {
    ChevronLeft,
    ChevronRight,
    Folder,
    Description,
} from '@mui/icons-material'
import FileExplorer from './FileExplorer'

interface SidebarProps {
    open: boolean
    onToggle: () => void
}

type TabValue = 'files' | 'docs'

export default function Sidebar({open, onToggle}: SidebarProps) {
    const [activeTab, setActiveTab] = useState<TabValue>('files')

    const drawerWidth = 320

    return (
        <>
            {/* Sidebar Toggle Button (Always Visible) */}
            <IconButton
                onClick={onToggle}
                sx={{
                    position: 'fixed',
                    left: open ? drawerWidth - 20 : 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1300,
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 2,
                    transition: 'left 0.3s ease',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                {open ? <ChevronLeft/> : <ChevronRight/>}
            </IconButton>

            {/* Drawer */}
            <Drawer
                variant="persistent"
                anchor="left"
                open={open}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.default',
                    },
                }}
            >
                {/* Header with Logo */}
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minHeight: 64,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            background: 'linear-gradient(45deg, #06B6D4 30%, #0891B2 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Navigation
                    </Typography>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        minHeight: 48,
                        '& .MuiTab-root': {
                            minHeight: 48,
                            textTransform: 'none',
                            fontWeight: 500,
                        },
                    }}
                >
                    <Tab
                        value="files"
                        icon={<Folder fontSize="small"/>}
                        iconPosition="start"
                        label="Files"
                    />
                    <Tab
                        value="docs"
                        icon={<Description fontSize="small"/>}
                        iconPosition="start"
                        label="Documents"
                    />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{flex: 1, overflow: 'hidden'}}>
                    {activeTab === 'files' && <FileExplorer/>}
                    {activeTab === 'docs' && (
                        <Box sx={{p: 2}}>
                            <Typography variant="body2" color="text.secondary">
                                Document management coming soon...
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Drawer>
        </>
    )
}