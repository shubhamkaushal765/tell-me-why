import { z } from 'zod'

// ============================================================================
// Zod Schemas (Runtime Validation + Type Inference)
// ============================================================================

// Source reference schema
export const SourceSchema = z.object({
    file: z.string(),
    content: z.string(),
    score: z.number().optional(),
})

// Single message schema
export const MessageSchema = z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.number(),
    sources: z.array(z.object({
        content: z.string(),
        metadata: z.object({
            source: z.string(),
        }).passthrough(),
    })).optional(),
    model: z.string().optional(),
    llm_type: z.enum(['ollama', 'claude']).optional(),
    privacy_note: z.string().optional(),
    error: z.boolean().optional(),
})

// Query request schema
export const QueryRequestSchema = z.object({
    query: z.string().min(1, 'Query cannot be empty'),
    llm: z.enum(['ollama', 'claude']).default('ollama'),
    max_results: z.number().int().positive().default(5),
})

// Query response schema
export const QueryResponseSchema = z.object({
    answer: z.string(),
    sources: z.array(SourceSchema),
    model_used: z.string(),
    processing_time: z.number().optional(),
})

// Health check response schema
export const HealthResponseSchema = z.object({
    status: z.string(),
    timestamp: z.string(),
    version: z.string().optional(),
})

// Stats response schema
export const StatsResponseSchema = z.object({
    vector_store: z.object({
        total_documents: z.number(),
        last_indexed: z.string().optional(),
    }),
    llm: z.object({
        default: z.string(),
        claude_available: z.boolean(),
        ollama_available: z.boolean().optional(),
    }),
    system: z.object({
        uptime: z.number().optional(),
        memory_usage: z.number().optional(),
    }).optional(),
})

// Available models response schema
export const ModelsResponseSchema = z.object({
    models: z.array(z.object({
        id: z.string(),
        name: z.string(),
        provider: z.string(),
        available: z.boolean(),
    })),
})

// Ingest request schema
export const IngestRequestSchema = z.object({
    directory: z.string(),
    force_reindex: z.boolean().default(false),
})

// Ingest response schema
export const IngestResponseSchema = z.object({
    status: z.string(),
    documents_processed: z.number(),
    message: z.string(),
})

// Error response schema
export const ErrorResponseSchema = z.object({
    error: z.string(),
    detail: z.string().optional(),
    status_code: z.number().optional(),
})

// ============================================================================
// TypeScript Types (Inferred from Zod Schemas)
// ============================================================================

export type Source = z.infer<typeof SourceSchema>
export type Message = z.infer<typeof MessageSchema>
export type QueryRequest = z.infer<typeof QueryRequestSchema>
export type QueryResponse = z.infer<typeof QueryResponseSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type StatsResponse = z.infer<typeof StatsResponseSchema>
export type ModelsResponse = z.infer<typeof ModelsResponseSchema>
export type IngestRequest = z.infer<typeof IngestRequestSchema>
export type IngestResponse = z.infer<typeof IngestResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// Alias for compatibility
export type ChatMessage = Message

// ============================================================================
// Additional UI-specific Types
// ============================================================================

export type LLMProvider = 'ollama' | 'claude'

export interface ChatState {
    messages: Message[]
    isLoading: boolean
    error: string | null
}

export interface APIError extends Error {
    status?: number
    statusText?: string
    data?: ErrorResponse
}

// ============================================================================
// Constants
// ============================================================================

export const LLM_PROVIDERS: Record<LLMProvider, { label: string; description: string }> = {
    ollama: {
        label: 'Ollama (Local)',
        description: 'Fast, private, runs on your machine',
    },
    claude: {
        label: 'Claude (Cloud)',
        description: 'More capable, requires API key',
    },
}

export const DEFAULT_MAX_RESULTS = 5
export const MAX_MESSAGE_LENGTH = 10000
export const CHAT_STORAGE_KEY = 'tmw-chat-history'
export const THEME_STORAGE_KEY = 'theme-mode'