'use client'

import {useRef, useEffect} from 'react'
import {Box, Container, CircularProgress, Typography} from '@mui/material'
import {useChat} from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import {LLMType} from '@/lib_fe/types'

export default function ChatInterface() {
    const {messages, isLoading, sendMessage, deleteMessage} = useChat()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages])

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Messages Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    pb: 2,
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'background.default',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'action.disabled',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'action.disabledBackground',
                        },
                    },
                }}
            >
                <Container maxWidth="md" sx={{py: 3}}>
                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '50vh',
                                textAlign: 'center',
                                gap: 3,
                            }}
                        >
                            <Typography variant="h3" fontWeight={700} color="text.primary">
                                Tell Me Why
                            </Typography>
                            <Typography variant="h6" color="text.secondary" maxWidth="600px">
                                Your private RAG code assistant. Ask questions about your codebase, generate
                                components, or debug issues.
                            </Typography>
                            <Box sx={{mt: 2}}>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    Try asking:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                        alignItems: 'center',
                                    }}
                                >
                                    {[
                                        'Generate a login component',
                                        'Explain the authentication module',
                                        'Debug this code: [paste your code]',
                                        'What are the best practices for state management?',
                                    ].map((example, idx) => (
                                        <Typography
                                            key={idx}
                                            variant="body2"
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                backgroundColor: 'action.hover',
                                                borderRadius: 2,
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            "{example}"
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    onDelete={deleteMessage}
                                />
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <Box sx={{display: 'flex', justifyContent: 'flex-start', mb: 2}}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            px: 3,
                                            py: 2,
                                            backgroundColor: 'background.paper',
                                            borderRadius: 3,
                                        }}
                                    >
                                        <CircularProgress size={20}/>
                                        <Typography variant="body2" color="text.secondary">
                                            Thinking...
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            <div ref={messagesEndRef}/>
                        </>
                    )}
                </Container>
            </Box>

            {/* Input Area */}
            <Box
                sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                    py: 2,
                }}
            >
                <Container maxWidth="md">
                    <MessageInput
                        onSend={(message: string, llmType: LLMType) => sendMessage(message, llmType)}
                        isLoading={isLoading}
                    />
                </Container>
            </Box>
        </Box>
    )
}