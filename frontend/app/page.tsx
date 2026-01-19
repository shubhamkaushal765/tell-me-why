'use client'

import {useState} from 'react'
import {Box} from '@mui/material'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ChatInterface from '@/components/chat/ChatInterface'

export default function HomePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    return (
        <Box
            sx={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Header/>
            <Box sx={{display: 'flex', flex: 1, overflow: 'hidden'}}>
                <Sidebar open={sidebarOpen}
                         onToggle={() => setSidebarOpen(!sidebarOpen)}/>
                <Box
                    sx={{
                        flex: 1,
                        overflow: 'hidden',
                        width: '100%',
                        transition: 'margin-left 0.3s ease',
                        marginLeft: sidebarOpen ? '320px' : '0',
                    }}
                >
                    <ChatInterface/>
                </Box>
            </Box>
        </Box>
    )
}