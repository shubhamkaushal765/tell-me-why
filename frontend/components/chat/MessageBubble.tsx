'use client'

import {
    Box,
    Paper,
    Typography,
    Chip,
    IconButton,
    Collapse,
    alpha
} from '@mui/material'
import {ExpandMore, Delete, Person, SmartToy} from '@mui/icons-material'
import {useState} from 'react'
import {ChatMessage} from '@/lib_fe/types'
import {parseCodeBlocks, formatDate} from '@/lib_fe/utils'
import CodeBlock from './CodeBlock'

interface MessageBubbleProps {
    message: ChatMessage
    onDelete?: (id: string) => void
}

export function MessageBubble({
                                  message,
                                  onDelete
                              }: MessageBubbleProps) {
    const [sourcesExpanded, setSourcesExpanded] = useState(false)
    const isUser = message.role === 'user'
    const blocks = parseCodeBlocks(message.content)

    // @ts-ignore
    // @ts-ignore
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
                position: 'relative',
                '&:hover .delete-button': {
                    opacity: 1,
                },
            }}
        >
            {/* Avatar */}
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isUser
                        ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                        : alpha('#64748b', 0.1),
                    color: isUser ? 'white' : 'text.secondary',
                    boxShadow: isUser ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none',
                }}
            >
                {isUser ? <Person/> : <SmartToy/>}
            </Box>

            {/* Message Content */}
            <Box sx={{flex: 1, minWidth: 0, maxWidth: '75%'}}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        backgroundColor: isUser
                            ? alpha('#2563eb', 0.08)
                            : 'background.paper',
                        border: '1px solid',
                        borderColor: isUser ? alpha('#2563eb', 0.2) : 'divider',
                        borderRadius: 2.5,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        },
                    }}
                >
                    {onDelete && (
                        <IconButton
                            className="delete-button"
                            size="small"
                            onClick={() => onDelete(message.id)}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                opacity: 0,
                                transition: 'opacity 0.2s, transform 0.2s',
                                color: 'text.secondary',
                                '&:hover': {
                                    color: 'error.main',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            <Delete fontSize="small"/>
                        </IconButton>
                    )}

                    {/* Content blocks */}
                    <Box>
                        {blocks.map((block, index) =>
                            block.type === 'code' ? (
                                <CodeBlock
                                    key={index}
                                    code={block.content}
                                    language={block.language}
                                />
                            ) : (
                                <Typography
                                    key={index}
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        lineHeight: 1.7,
                                        color: 'text.primary',
                                    }}
                                >
                                    {block.content}
                                </Typography>
                            )
                        )}
                    </Box>

                    {/* Metadata */}
                    {!isUser && (
                        <Box
                            sx={{
                                mt: 2,
                                pt: 1.5,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                            }}
                        >
                            {message.llm_type && (
                                <Chip
                                    label={message.llm_type === 'ollama' ? 'Ollama' : 'Claude'}
                                    size="small"
                                    sx={{
                                        height: 24,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: message.llm_type === 'ollama'
                                            ? alpha('#10b981', 0.1)
                                            : alpha('#f59e0b', 0.1),
                                        color: message.llm_type === 'ollama'
                                            ? '#10b981'
                                            : '#f59e0b',
                                        border: 'none',
                                    }}
                                />
                            )}
                            <Typography variant="caption"
                                        color="text.secondary"
                                        fontWeight={500}>
                                {formatDate(message.timestamp)}
                            </Typography>
                        </Box>
                    )}

                    {/* Privacy note */}
                    {message.privacy_note && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                mt: 1,
                                color: 'text.secondary',
                                fontStyle: 'italic',
                            }}
                        >
                            {message.privacy_note}
                        </Typography>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                        <Box sx={{mt: 2}}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 1.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                            >
                                <Typography variant="caption" fontWeight={700}
                                            color="text.secondary">
                                    {message.sources.length} {message.sources.length === 1 ? 'Source' : 'Sources'}
                                </Typography>
                                <IconButton
                                    size="small"
                                    sx={{
                                        ml: 0.5,
                                        transform: sourcesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                    }}
                                >
                                    <ExpandMore fontSize="small"/>
                                </IconButton>
                            </Box>

                            <Collapse in={sourcesExpanded}>
                                <Box sx={{
                                    mt: 1.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1
                                }}>
                                    {message.sources.map((source, idx) => (
                                        <Paper
                                            key={idx}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                backgroundColor: alpha('#000', 0.02),
                                                borderRadius: 1.5,
                                                borderColor: 'divider',
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                fontWeight={700}
                                                display="block"
                                                mb={0.75}
                                                color="primary.main"
                                            >
                                                {source.metadata.source || `Source ${idx + 1}`}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    overflow: 'hidden',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {source.content}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Box>
    )
}