'use client'

import {Box} from '@mui/material'
import Header from '@/components/layout/Header'
import ChatInterface from '@/components/chat/ChatInterface'

export default function HomePage() {
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
            <Box sx={{flex: 1, overflow: 'hidden', width: '100%'}}>
                <ChatInterface/>
            </Box>
        </Box>
    )
}