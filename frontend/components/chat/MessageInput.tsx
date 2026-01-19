'use client'

import {useState, FormEvent, KeyboardEvent} from 'react'
import {
    Box,
    TextField,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Tooltip,
    Typography,
    alpha,
} from '@mui/material'
import {Send, Stop, Lock, Bolt} from '@mui/icons-material'
import {LLMType} from '@/lib_fe/types'

interface MessageInputProps {
    onSend: (message: string, llmType: LLMType) => void
    isLoading: boolean
    onStop?: () => void
}

export default function MessageInput({
                                         onSend,
                                         isLoading,
                                         onStop
                                     }: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [llmType, setLlmType] = useState<LLMType>('ollama')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (message.trim() && !isLoading) {
            onSend(message.trim(), llmType)
            setMessage('')
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <Paper
            component="form"
            onSubmit={handleSubmit}
            elevation={0}
            sx={{
                p: 2.5,
                backgroundColor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
        >
            <Box sx={{display: 'flex', gap: 2, alignItems: 'flex-end'}}>
                <FormControl size="small" sx={{minWidth: 140}}>
                    <InputLabel sx={{fontWeight: 600}}>Model</InputLabel>
                    <Select
                        value={llmType}
                        label="Model"
                        onChange={(e) => setLlmType(e.target.value as LLMType)}
                        disabled={isLoading}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                        }}
                    >
                        <MenuItem value="ollama">
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Lock sx={{
                                    fontSize: 18,
                                    color: 'success.main'
                                }}/>
                                <Box>
                                    <Typography variant="body2"
                                                fontWeight={600}>
                                        Ollama
                                    </Typography>
                                    <Typography variant="caption"
                                                color="text.secondary">
                                        Private & Local
                                    </Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                        <MenuItem value="claude">
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Bolt sx={{
                                    fontSize: 18,
                                    color: 'warning.main'
                                }}/>
                                <Box>
                                    <Typography variant="body2"
                                                fontWeight={600}>
                                        Claude
                                    </Typography>
                                    <Typography variant="caption"
                                                color="text.secondary">
                                        Fast & Powerful
                                    </Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    multiline
                    maxRows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about your codebase..."
                    disabled={isLoading}
                    variant="outlined"
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: '0.9375rem',
                            backgroundColor: alpha('#000', 0.02),
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: alpha('#000', 0.03),
                            },
                            '&.Mui-focused': {
                                backgroundColor: 'background.paper',
                                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                        },
                    }}
                />

                <Tooltip title={isLoading ? 'Stop' : 'Send (Enter)'}>
                    <span>
                        <IconButton
                            type={isLoading ? 'button' : 'submit'}
                            onClick={isLoading ? onStop : undefined}
                            disabled={!isLoading && !message.trim()}
                            sx={{
                                width: 48,
                                height: 48,
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                color: 'white',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: 'action.disabledBackground',
                                    color: 'action.disabled',
                                    background: 'none',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isLoading ? <Stop/> : <Send/>}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            <Box sx={{
                mt: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                px: 0.5
            }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                    }}
                >
                    {llmType === 'ollama' ? (
                        <>
                            <Lock sx={{fontSize: 14, color: 'success.main'}}/>
                            <span>Your data stays on your machine</span>
                        </>
                    ) : (
                        <>
                            <Bolt sx={{fontSize: 14, color: 'warning.main'}}/>
                            <span>Data sent to Anthropic servers</span>
                        </>
                    )}
                </Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{fontWeight: 500}}
                >
                    <Box component="kbd" sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        backgroundColor: alpha('#000', 0.05),
                        border: '1px solid',
                        borderColor: 'divider',
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                    }}>
                        Shift
                    </Box>
                    {' + '}
                    <Box component="kbd" sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        backgroundColor: alpha('#000', 0.05),
                        border: '1px solid',
                        borderColor: 'divider',
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                    }}>
                        Enter
                    </Box>
                    {' for new line'}
                </Typography>
            </Box>
        </Paper>
    )
}