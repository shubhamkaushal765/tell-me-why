'use client'

import {useState} from 'react'
import {Box, IconButton, Typography, Paper, alpha} from '@mui/material'
import {ContentCopy, Check} from '@mui/icons-material'
import {copyToClipboard} from '@/lib_fe/utils'

interface CodeBlockProps {
    code: string
    language?: string
}

export default function CodeBlock({code, language = 'text'}: CodeBlockProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        const success = await copyToClipboard(code)
        if (success) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Paper
            elevation={0}
            sx={{
                position: 'relative',
                backgroundColor: alpha('#000', 0.04),
                borderRadius: 2,
                overflow: 'hidden',
                my: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: alpha('#000', 0.02),
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#ff5f56',
                        }}
                    />
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#ffbd2e',
                        }}
                    />
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: '#27c93f',
                        }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            ml: 1,
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                        }}
                    >
                        {language}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{
                        color: 'text.secondary',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                            color: copied ? 'success.main' : 'primary.main',
                            transform: 'scale(1.1)',
                        },
                    }}
                >
                    {copied ? <Check fontSize="small"/> :
                        <ContentCopy fontSize="small"/>}
                </IconButton>
            </Box>

            {/* Code content */}
            <Box
                component="pre"
                sx={{
                    m: 0,
                    p: 2.5,
                    overflow: 'auto',
                    maxHeight: '500px',
                    backgroundColor: alpha('#000', 0.02),
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha('#000', 0.2),
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: alpha('#000', 0.3),
                        },
                    },
                }}
            >
                <Box
                    component="code"
                    sx={{
                        fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", Consolas, Monaco, monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.7,
                        color: 'text.primary',
                        whiteSpace: 'pre',
                        fontWeight: 450,
                    }}
                >
                    {code}
                </Box>
            </Box>
        </Paper>
    )
}