import {NextRequest, NextResponse} from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * API Proxy Route
 *
 * This proxies requests to the backend API.
 * Usage: POST /api/query with { query, llm_type }
 *
 * This is optional - you can also call the backend directly from the client.
 * Benefits of using this proxy:
 * - Hide backend URL from client
 * - Add authentication/rate limiting
 * - Transform requests/responses
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const response = await fetch(`${API_BASE_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                detail: `HTTP error! status: ${response.status}`,
            }))

            return NextResponse.json(
                {detail: errorData.detail || 'Backend request failed'},
                {status: response.status}
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('API proxy error:', error)

        return NextResponse.json(
            {
                detail: error instanceof Error ? error.message : 'Internal server error',
            },
            {status: 500}
        )
    }
}