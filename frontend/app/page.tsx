'use client'

import {Box} from '@mui/material'
import Header from '@/components/layout/Header'
import ChatInterface from '@/components/chat/ChatInterface'

export default function HomePage() {
    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Header/>
            <Box sx={{flex: 1, overflow: 'hidden'}}>
                <ChatInterface/>
            </Box>
        </Box>
    )
}