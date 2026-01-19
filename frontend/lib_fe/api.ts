import {z} from 'zod'
import {
    QueryRequest,
    QueryResponse,
    QueryResponseSchema,
    HealthResponse,
    HealthResponseSchema,
    StatsResponse,
    StatsResponseSchema,
    ModelsResponse,
    ModelsResponseSchema,
    IngestRequest,
    IngestResponse,
    IngestResponseSchema,
    ErrorResponse,
    ErrorResponseSchema,
    APIError,
} from './types'

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const DEFAULT_TIMEOUT = 30000 // 30 seconds

// ============================================================================
// Error Handling
// ============================================================================

class APIClientError extends Error implements APIError {
    status?: number
    statusText?: string
    data?: ErrorResponse

    constructor(message: string, status?: number, statusText?: string, data?: ErrorResponse) {
        super(message)
        this.name = 'APIClientError'
        this.status = status
        this.statusText = statusText
        this.data = data
    }
}

// ============================================================================
// Fetch Wrapper with Timeout
// ============================================================================

async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return response
    } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
            throw new APIClientError('Request timeout', 408, 'Request Timeout')
        }
        throw error
    }
}

// ============================================================================
// Generic API Request Handler
// ============================================================================

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    schema: z.ZodSchema<T>,
    timeout?: number
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    try {
        const response = await fetchWithTimeout(
            url,
            {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            },
            timeout
        )

        // Handle non-OK responses
        if (!response.ok) {
            let errorData: ErrorResponse | undefined

            try {
                const jsonError = await response.json()
                const parsed = ErrorResponseSchema.safeParse(jsonError)
                errorData = parsed.success ? parsed.data : undefined
            } catch {
                // If parsing fails, we'll use generic error
            }

            const message =
                errorData?.error ||
                errorData?.detail ||
                `API request failed: ${response.status} ${response.statusText}`

            throw new APIClientError(message, response.status, response.statusText, errorData)
        }

        // Parse and validate response body
        const data = await response.json()
        const result = schema.safeParse(data)

        if (!result.success) {
            console.error('Schema validation error:', result.error)
            throw new APIClientError(
                'Invalid response format from server',
                500,
                'Schema Validation Failed'
            )
        }

        return result.data
    } catch (error) {
        // Re-throw APIClientError as-is
        if (error instanceof APIClientError) {
            throw error
        }

        // Network errors or other fetch failures
        if (error instanceof Error) {
            throw new APIClientError(
                `Network error: ${error.message}`,
                0,
                'Network Error'
            )
        }

        // Unknown error
        throw new APIClientError('An unknown error occurred', 0, 'Unknown Error')
    }
}

// ============================================================================
// API Client
// ============================================================================

export const apiClient = {
    /**
     * Health check endpoint
     */
    async healthCheck(): Promise<HealthResponse> {
        return apiRequest('/health', {method: 'GET'}, HealthResponseSchema, 5000)
    },

    /**
     * Send a query to the RAG system
     */
    async query(request: QueryRequest): Promise<QueryResponse> {
        return apiRequest(
            '/query',
            {
                method: 'POST',
                body: JSON.stringify(request),
            },
            QueryResponseSchema,
            60000 // Longer timeout for LLM processing
        )
    },

    /**
     * Get system statistics
     */
    async getStats(): Promise<StatsResponse> {
        return apiRequest('/stats', {method: 'GET'}, StatsResponseSchema)
    },

    /**
     * Get available models
     */
    async getModels(): Promise<ModelsResponse> {
        return apiRequest('/models', {method: 'GET'}, ModelsResponseSchema)
    },

    /**
     * Trigger ingestion of documents
     */
    async ingest(request: IngestRequest): Promise<IngestResponse> {
        return apiRequest(
            '/ingest',
            {
                method: 'POST',
                body: JSON.stringify(request),
            },
            IngestResponseSchema,
            120000 // 2 minutes for ingestion
        )
    },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if error is an API error
 */
export function isAPIError(error: unknown): error is APIClientError {
    return error instanceof APIClientError
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    if (isAPIError(error)) {
        return error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return 'An unexpected error occurred'
}

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        await apiClient.healthCheck()
        return true
    } catch {
        return false
    }
}