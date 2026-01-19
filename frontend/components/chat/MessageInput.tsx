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
} from '@mui/material'
import {Send, Stop} from '@mui/icons-material'
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
        // Send on Enter, but allow Shift+Enter for new lines
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <Paper
            component="form"
            onSubmit={handleSubmit}
            elevation={3}
            sx={{
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: 3,
            }}
        >
            <Box sx={{display: 'flex', gap: 2, alignItems: 'flex-end'}}>
                {/* LLM Selection */}
                <FormControl size="small" sx={{minWidth: 120}}>
                    <InputLabel>Model</InputLabel>
                    <Select
                        value={llmType}
                        label="Model"
                        onChange={(e) => setLlmType(e.target.value as LLMType)}
                        disabled={isLoading}
                    >
                        <MenuItem value="ollama">
                            <Box>
                                <Box component="span" fontWeight={600}>
                                    Ollama
                                </Box>
                                <Box component="span" fontSize="0.75rem"
                                     color="text.secondary" ml={1}>
                                    🔒 Private
                                </Box>
                            </Box>
                        </MenuItem>
                        <MenuItem value="claude">
                            <Box>
                                <Box component="span" fontWeight={600}>
                                    Claude
                                </Box>
                                <Box component="span" fontSize="0.75rem"
                                     color="text.secondary" ml={1}>
                                    ⚡ Fast
                                </Box>
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* Message Input */}
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
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
                        },
                    }}
                />

                {/* Send/Stop Button */}
                <Tooltip title={isLoading ? 'Stop' : 'Send (Enter)'}>
                    <span>
                        <IconButton
                            type={isLoading ? 'button' : 'submit'}
                            onClick={isLoading ? onStop : undefined}
                            color="primary"
                            disabled={!isLoading && !message.trim()}
                            sx={{
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                    backgroundColor: 'primary.dark',
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: 'action.disabledBackground',
                                    color: 'action.disabled',
                                },
                            }}
                        >
                            {isLoading ? <Stop/> : <Send/>}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* Helper text */}
            <Box
                sx={{mt: 1, display: 'flex', justifyContent: 'space-between'}}>
                <Box component="span" fontSize="0.75rem"
                     color="text.secondary">
                    {llmType === 'ollama' ? (
                        '🔒 Your data stays on your machine'
                    ) : (
                        '⚠️ Data sent to Anthropic servers'
                    )}
                </Box>
                <Box component="span" fontSize="0.75rem"
                     color="text.secondary">
                    Press <strong>Shift+Enter</strong> for new line
                </Box>
            </Box>
        </Paper>
    )
}