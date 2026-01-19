'use client'

import {useState, useEffect} from 'react'
import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Alert,
    Chip,
    Tooltip,
    Paper,
} from '@mui/material'
import {
    ArrowBack,
    ContentCopy,
    Check,
} from '@mui/icons-material'
import {apiClient} from '@/lib_fe/api'
import {FileContentResponse} from '@/lib_fe/types'
import {copyToClipboard} from '@/lib_fe/utils'

interface FileViewerProps {
    filePath: string
    onClose: () => void
}

export default function FileViewer({filePath, onClose}: FileViewerProps) {
    const [content, setContent] = useState<FileContentResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        loadFileContent()
    }, [filePath])

    const loadFileContent = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await apiClient.getFileContent(filePath)
            setContent(response)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load file')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (content?.content) {
            const success = await copyToClipboard(content.content)
            if (success) {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        }
    }

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const getLanguageFromExtension = (ext: string): string => {
        const map: Record<string, string> = {
            ts: 'typescript',
            tsx: 'typescript',
            js: 'javascript',
            jsx: 'javascript',
            py: 'python',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            rs: 'rust',
            go: 'go',
            rb: 'ruby',
            php: 'php',
            swift: 'swift',
            kt: 'kotlin',
            cs: 'csharp',
            html: 'html',
            css: 'css',
            json: 'json',
            yaml: 'yaml',
            yml: 'yaml',
            md: 'markdown',
            sql: 'sql',
            sh: 'bash',
        }
        return map[ext.toLowerCase()] || ext
    }

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <IconButton size="small" onClick={onClose}>
                    <ArrowBack fontSize="small"/>
                </IconButton>
                <Typography variant="subtitle2" fontWeight={600} noWrap
                            sx={{flex: 1}}>
                    {content?.name || 'Loading...'}
                </Typography>
            </Box>

            {/* Metadata */}
            {content && (
                <Box
                    sx={{
                        p: 1.5,
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                    }}
                >
                    <Chip
                        label={getLanguageFromExtension(content.extension)}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                    <Chip
                        label={formatBytes(content.size)}
                        size="small"
                        variant="outlined"
                    />
                    {content.lines && (
                        <Chip
                            label={`${content.lines} lines`}
                            size="small"
                            variant="outlined"
                        />
                    )}
                    <Box sx={{flex: 1}}/>
                    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                        <IconButton size="small" onClick={handleCopy}>
                            {copied ? <Check fontSize="small"/> :
                                <ContentCopy fontSize="small"/>}
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Content */}
            <Box sx={{flex: 1, overflow: 'auto', p: 2}}>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                        }}
                    >
                        <CircularProgress size={32}/>
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : content ? (
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: 'code.background',
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                p: 2,
                                overflow: 'auto',
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
                                {content.content}
                            </Box>
                        </Box>
                    </Paper>
                ) : null}
            </Box>
        </Box>
    )
}