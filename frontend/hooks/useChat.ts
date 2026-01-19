'use client'

import {useState, useCallback} from 'react'
import {apiClient} from '@/lib_fe/api'
import {ChatMessage, LLMType} from '@/lib_fe/types'
import {generateId} from '@/lib_fe/utils'
import {useSnackbar} from 'notistack'

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const {enqueueSnackbar} = useSnackbar()

    const sendMessage = useCallback(async (content: string, llmType: LLMType) => {
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const response = await apiClient.query({
                query: content,
                llm_type: llmType,
            })

            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: response.answer,
                timestamp: Date.now(),
                sources: response.sources.map(source => ({
                    file: source.file,
                    content: source.content,
                    score: source.score,
                    metadata: {source: source.file},
                })),
                llm_type: llmType,
                privacy_note: response.privacy_note,
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                timestamp: Date.now(),
                error: true,
            }

            setMessages(prev => [...prev, errorMessage])
            enqueueSnackbar('Failed to send message', {variant: 'error'})
        } finally {
            setIsLoading(false)
        }
    }, [enqueueSnackbar])

    const deleteMessage = useCallback((id: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== id))
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    return {
        messages,
        isLoading,
        sendMessage,
        deleteMessage,
        clearMessages,
    }
}