import {z} from 'zod'

// ============================================================================
// Zod Schemas (Runtime Validation + Type Inference)
// ============================================================================

// Source reference schema
export const SourceSchema = z.object({
    file: z.string(),
    content: z.string(),
    score: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
})

// Single message schema (for UI state management)
export const MessageSchema = z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.number(),
    sources: z.array(SourceSchema).optional(),
    llm_type: z.enum(['ollama', 'claude']).optional(),
    privacy_note: z.string().optional(),
    error: z.boolean().optional(),
})

// Query request schema (matches backend)
export const QueryRequestSchema = z.object({
    query: z.string().min(1, 'Query cannot be empty'),
    llm_type: z.enum(['ollama', 'claude']).default('ollama'),
})

// Query response schema (matches backend)
export const QueryResponseSchema = z.object({
    answer: z.string(),
    sources: z.array(SourceSchema),
    llm_type: z.string(),
    privacy_note: z.string(),
})

// Health check response schema (matches backend)
export const HealthResponseSchema = z.object({
    status: z.string(),
    version: z.string(),
    llm_default: z.string(),
    vector_store_path: z.string(),
})

// Stats response schema (matches backend)
export const StatsResponseSchema = z.object({
    vector_store: z.object({
        total_documents: z.number(),
        embedding_model: z.string(),
        location: z.string(),
    }),
    llm: z.object({
        default: z.string(),
        ollama_model: z.string(),
        claude_model: z.string(),
        claude_available: z.boolean(),
    }),
    retrieval: z.object({
        top_k: z.number(),
        chunk_size: z.number(),
        chunk_overlap: z.number(),
    }),
})

// Models response schema (matches backend)
export const ModelsResponseSchema = z.object({
    default: z.string(),
    models: z.object({
        ollama: z.object({
            available: z.boolean(),
            model: z.string(),
            base_url: z.string(),
            privacy: z.string(),
        }),
        claude: z.object({
            available: z.boolean(),
            model: z.string(),
            privacy: z.string(),
        }),
    }),
})

// Ingest request schema (matches backend)
export const IngestRequestSchema = z.object({
    force_reingest: z.boolean().default(false),
})

// Ingest response schema (matches backend)
export const IngestResponseSchema = z.object({
    status: z.string(),
    message: z.string(),
})

// Config response schema
export const ConfigResponseSchema = z.record(z.unknown())

// File tree node schema
export const FileTreeNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        name: z.string(),
        type: z.enum(['file', 'directory']),
        path: z.string(),
        size: z.number().optional(),
        children: z.array(FileTreeNodeSchema).optional(),
    })
)

// File tree response schema
export const FileTreeResponseSchema = z.object({
    root: z.string(),
    tree: FileTreeNodeSchema,
})

// File content response schema
export const FileContentResponseSchema = z.object({
    path: z.string(),
    name: z.string(),
    extension: z.string(),
    size: z.number(),
    content_type: z.string(),
    content: z.string(),
    lines: z.number().optional(),
})

// File search response schema
export const FileSearchResponseSchema = z.object({
    pattern: z.string(),
    count: z.number(),
    max_results: z.number(),
    files: z.array(
        z.object({
            path: z.string(),
            name: z.string(),
            size: z.number().optional(),
        })
    ),
})

// Error response schema
export const ErrorResponseSchema = z.object({
    detail: z.string(),
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
export type ConfigResponse = z.infer<typeof ConfigResponseSchema>
export type FileTreeNode = z.infer<typeof FileTreeNodeSchema>
export type FileTreeResponse = z.infer<typeof FileTreeResponseSchema>
export type FileContentResponse = z.infer<typeof FileContentResponseSchema>
export type FileSearchResponse = z.infer<typeof FileSearchResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// Alias for compatibility
export type ChatMessage = Message
export type LLMType = 'ollama' | 'claude'

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

export const LLM_PROVIDERS: Record<LLMProvider, {
    label: string;
    description: string
}> = {
    ollama: {
        label: 'Ollama (Local)',
        description: '✓ Fully local - your data never leaves your machine',
    },
    claude: {
        label: 'Claude (Cloud)',
        description: '⚠ Cloud-based - data is sent to Anthropic servers',
    },
}

export const DEFAULT_MAX_RESULTS = 5
export const MAX_MESSAGE_LENGTH = 10000
export const CHAT_STORAGE_KEY = 'tmw-chat-history'
export const THEME_STORAGE_KEY = 'theme-mode'