'use client'

import {useRef, useEffect} from 'react'
import {
    Box,
    Container,
    CircularProgress,
    Typography,
    alpha
} from '@mui/material'
import {Code, AutoAwesome, BugReport, School} from '@mui/icons-material'
import {useChat} from '@/hooks/useChat'
import {MessageBubble} from './MessageBubble'
import MessageInput from './MessageInput'
import {LLMType} from '@/lib_fe/types'

export default function ChatInterface() {
    const {messages, isLoading, sendMessage, deleteMessage} = useChat()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages])

    const examples = [
        {
            icon: Code,
            text: 'Generate a React login component',
            color: '#2563eb',
        },
        {
            icon: AutoAwesome,
            text: 'Explain the authentication flow',
            color: '#7c3aed',
        },
        {
            icon: BugReport,
            text: 'Debug: Why is my API returning 404?',
            color: '#dc2626',
        },
        {
            icon: School,
            text: 'Best practices for state management',
            color: '#059669',
        },
    ]

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
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
                        backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha('#000', 0.1),
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: alpha('#000', 0.15),
                        },
                    },
                }}
            >
                <Container maxWidth="lg" sx={{py: 4}}>
                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '60vh',
                                textAlign: 'center',
                                gap: 4,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                                    animation: 'pulse 2s ease-in-out infinite',
                                    '@keyframes pulse': {
                                        '0%, 100%': {
                                            transform: 'scale(1)',
                                        },
                                        '50%': {
                                            transform: 'scale(1.05)',
                                        },
                                    },
                                }}
                            >
                                <Code sx={{color: 'white', fontSize: 40}}/>
                            </Box>

                            <Box>
                                <Typography
                                    variant="h3"
                                    fontWeight={700}
                                    sx={{
                                        mb: 1.5,
                                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    Tell Me Why
                                </Typography>
                                <Typography
                                    variant="h6"
                                    color="text.secondary"
                                    maxWidth="600px"
                                    sx={{lineHeight: 1.6, fontWeight: 400}}
                                >
                                    Your private RAG code assistant. Ask
                                    questions about your codebase,
                                    generate components, or debug issues.
                                </Typography>
                            </Box>

                            <Box
                                sx={{mt: 2, width: '100%', maxWidth: '700px'}}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={2}
                                    fontWeight={600}
                                >
                                    Try asking:
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            md: 'repeat(2, 1fr)'
                                        },
                                        gap: 2,
                                    }}
                                >
                                    {examples.map((example, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 2.5,
                                                backgroundColor: 'background.paper',
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                                                    borderColor: example.color,
                                                },
                                            }}
                                            onClick={() => sendMessage(example.text, 'ollama')}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 1.5,
                                                    backgroundColor: alpha(example.color, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <example.icon sx={{
                                                    color: example.color,
                                                    fontSize: 20
                                                }}/>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    textAlign: 'left',
                                                    fontWeight: 500,
                                                    color: 'text.primary',
                                                }}
                                            >
                                                {example.text}
                                            </Typography>
                                        </Box>
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

                            {isLoading && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 2,
                                        mb: 3,
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: alpha('#64748b', 0.1),
                                            color: 'text.secondary',
                                        }}
                                    >
                                        <AutoAwesome/>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            px: 3,
                                            py: 2,
                                            backgroundColor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2.5,
                                        }}
                                    >
                                        <CircularProgress size={20}/>
                                        <Typography variant="body2"
                                                    color="text.secondary"
                                                    fontWeight={500}>
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
                    py: 2.5,
                    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
                }}
            >
                <Container maxWidth="lg">
                    <MessageInput
                        onSend={(message: string, llmType: LLMType) => sendMessage(message, llmType)}
                        isLoading={isLoading}
                    />
                </Container>
            </Box>
        </Box>
    )
}