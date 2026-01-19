'use client'

import {Box, Paper, Typography, Chip, IconButton, Collapse} from '@mui/material'
import {ExpandMore, Delete} from '@mui/icons-material'
import {useState} from 'react'
import {ChatMessage} from '@/lib_fe/types'
import {parseCodeBlocks, formatDate} from '@/lib_fe/utils'
import CodeBlock from './CodeBlock'

interface MessageBubbleProps {
    message: ChatMessage
    onDelete?: (id: string) => void
}

export default function MessageBubble({message, onDelete}: MessageBubbleProps) {
    const [sourcesExpanded, setSourcesExpanded] = useState(false)
    const isUser = message.role === 'user'
    const blocks = parseCodeBlocks(message.content)

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2,
                gap: 2,
                position: 'relative',
                '&:hover .delete-button': {
                    opacity: 1,
                },
            }}
        >
            <Paper
                elevation={isUser ? 1 : 0}
                sx={{
                    maxWidth: '75%',
                    p: 2,
                    backgroundColor: isUser ? 'primary.main' : 'background.paper',
                    color: isUser ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 3,
                    position: 'relative',
                }}
            >
                {/* Delete button */}
                {onDelete && (
                    <IconButton
                        className="delete-button"
                        size="small"
                        onClick={() => onDelete(message.id)}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            color: isUser ? 'inherit' : 'text.secondary',
                        }}
                    >
                        <Delete fontSize="small"/>
                    </IconButton>
                )}

                {/* Message content */}
                <Box>
                    {blocks.map((block, index) => (
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
                                }}
                            >
                                {block.content}
                            </Typography>
                        )
                    ))}
                </Box>

                {/* Metadata */}
                {!isUser && (
                    <Box sx={{mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center'}}>
                        {message.llm_type && (
                            <Chip
                                label={message.llm_type === 'ollama' ? 'Local' : 'Claude'}
                                size="small"
                                color={message.llm_type === 'ollama' ? 'success' : 'info'}
                                sx={{height: 20, fontSize: '0.7rem'}}
                            />
                        )}
                        <Typography variant="caption" color="text.secondary">
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
                            opacity: 0.7,
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
                                '&:hover': {opacity: 0.8},
                            }}
                            onClick={() => setSourcesExpanded(!sourcesExpanded)}
                        >
                            <Typography variant="caption" fontWeight={600}>
                                Sources ({message.sources.length})
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
                            <Box sx={{mt: 1}}>
                                {message.sources.map((source, idx) => (
                                    <Paper
                                        key={idx}
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            backgroundColor: 'background.default',
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                                            {source.metadata.source || `Source ${idx + 1}`}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                display: 'block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
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
    )
}