'use client'

import {useState} from 'react'
import {Box, IconButton, Typography, Paper} from '@mui/material'
import {ContentCopy, Check} from '@mui/icons-material'
import {copyToClipboard} from '@/lib/utils'

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
                backgroundColor: 'code.background',
                borderRadius: 2,
                overflow: 'hidden',
                my: 2,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: 'code.text',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                    }}
                >
                    {language}
                </Typography>
                <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{
                        color: 'code.text',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    {copied ? <Check fontSize="small"/> : <ContentCopy fontSize="small"/>}
                </IconButton>
            </Box>

            {/* Code content */}
            <Box
                component="pre"
                sx={{
                    m: 0,
                    p: 2,
                    overflow: 'auto',
                    maxHeight: '500px',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        },
                    },
                }}
            >
                <Box
                    component="code"
                    sx={{
                        fontFamily: '"Fira Code", "JetBrains Mono", Consolas, Monaco, monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        color: 'code.text',
                        whiteSpace: 'pre',
                    }}
                >
                    {code}
                </Box>
            </Box>
        </Paper>
    )
}
