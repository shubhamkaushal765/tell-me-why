'use client'

import {useState, useCallback, useEffect} from 'react'
import {apiClient} from '@/lib/api'
import {ChatMessage, LLMType, ApiError} from '@/lib/types'
import {generateId} from '@/lib/utils'

const STORAGE_KEY = 'tmw-chat-history'

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load messages from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                // Convert timestamp strings back to Date objects
                const messagesWithDates = parsed.map((msg: ChatMessage) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }))
                setMessages(messagesWithDates)
            }
        } catch (err) {
            console.error('Failed to load chat history:', err)
        }
    }, [])

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (messages.length === 0) return

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
        } catch (err) {
            console.error('Failed to save chat history:', err)
        }
    }, [messages])

    const sendMessage = useCallback(async (query: string, llmType: LLMType = 'ollama') => {
        if (!query.trim()) return

        setIsLoading(true)
        setError(null)

        // Add user message
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: query,
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])

        try {
            // Call API
            const response = await apiClient.query({
                query,
                llm_type: llmType,
            })

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
                llm_type: response.llm_type as LLMType,
                privacy_note: response.privacy_note,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.detail || 'An error occurred while processing your request')

            // Add error message to chat
            const errorMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: `❌ Error: ${apiError.detail || 'Failed to get response'}`,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    const deleteMessage = useCallback((id: string) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== id))
    }, [])

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        deleteMessage,
    }
}