import { Message, Source } from './types'

// ============================================================================
// Date & Time Utilities
// ============================================================================

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // Less than 1 minute
    if (diffMins < 1) {
        return 'Just now'
    }

    // Less than 1 hour
    if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    }

    // Less than 24 hours
    if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    }

    // Less than 7 days
    if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    }

    // Format as date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
}

/**
 * Format timestamp to full date and time
 */
export function formatFullTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

/**
 * Alias for formatTimestamp (for compatibility)
 */
export const formatDate = formatTimestamp

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate string to maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength - 3) + '...'
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
}

// ============================================================================
// Chat Export Utilities
// ============================================================================

/**
 * Export chat messages as Markdown
 */
export function exportChatAsMarkdown(messages: Message[]): string {
    const lines: string[] = []

    // Header
    lines.push('# Tell Me Why - Chat Export')
    lines.push(`\nExported on: ${new Date().toLocaleString()}\n`)
    lines.push('---\n')

    // Messages
    messages.forEach((message, index) => {
        const role = message.role === 'user' ? 'User' : 'Assistant'
        const timestamp = formatFullTimestamp(message.timestamp)

        lines.push(`## Message ${index + 1} - ${role}`)
        lines.push(`*${timestamp}*\n`)
        lines.push(message.content)

        // Add sources if available
        if (message.sources && message.sources.length > 0) {
            lines.push('\n### Sources\n')
            message.sources.forEach((source, idx) => {
                lines.push(`${idx + 1}. **${source.file}**`)
                if (source.score !== undefined) {
                    lines.push(`   - Relevance: ${(source.score * 100).toFixed(1)}%`)
                }
                lines.push('   ```')
                lines.push(`   ${source.content}`)
                lines.push('   ```')
            })
        }

        // Add model info if available
        if (message.model) {
            lines.push(`\n*Model: ${message.model}*`)
        }

        lines.push('\n---\n')
    })

    return lines.join('\n')
}

/**
 * Export chat messages as JSON
 */
export function exportChatAsJson(messages: Message[]): string {
    const exportData = {
        exported_at: new Date().toISOString(),
        message_count: messages.length,
        messages: messages.map((msg) => ({
            ...msg,
            timestamp_readable: formatFullTimestamp(msg.timestamp),
        })),
    }

    return JSON.stringify(exportData, null, 2)
}

/**
 * Download content as file
 */
export function downloadAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

// ============================================================================
// Source Utilities
// ============================================================================

/**
 * Group sources by file
 */
export function groupSourcesByFile(sources: Source[]): Record<string, Source[]> {
    return sources.reduce((acc, source) => {
        if (!acc[source.file]) {
            acc[source.file] = []
        }
        acc[source.file].push(source)
        return acc
    }, {} as Record<string, Source[]>)
}

/**
 * Get unique files from sources
 */
export function getUniqueFiles(sources: Source[]): string[] {
    return Array.from(new Set(sources.map((s) => s.file)))
}

/**
 * Sort sources by relevance score
 */
export function sortSourcesByRelevance(sources: Source[]): Source[] {
    return [...sources].sort((a, b) => {
        const scoreA = a.score ?? 0
        const scoreB = b.score ?? 0
        return scoreB - scoreA
    })
}

// ============================================================================
// Code Detection & Formatting
// ============================================================================

/**
 * Detect if content contains code blocks
 */
export function hasCodeBlocks(content: string): boolean {
    return /```[\s\S]*?```/.test(content)
}

/**
 * Parse content into text and code blocks
 * Returns array of blocks with type ('text' or 'code'), content, and optional language
 */
export function parseCodeBlocks(content: string): Array<{
    type: 'text' | 'code'
    content: string
    language?: string
}> {
    const blocks: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            const textContent = content.slice(lastIndex, match.index).trim()
            if (textContent) {
                blocks.push({
                    type: 'text',
                    content: textContent,
                })
            }
        }

        // Add code block
        blocks.push({
            type: 'code',
            content: match[2].trim(),
            language: match[1] || 'plaintext',
        })

        lastIndex = regex.lastIndex
    }

    // Add remaining text after last code block
    if (lastIndex < content.length) {
        const textContent = content.slice(lastIndex).trim()
        if (textContent) {
            blocks.push({
                type: 'text',
                content: textContent,
            })
        }
    }

    // If no code blocks were found, return the entire content as text
    if (blocks.length === 0) {
        blocks.push({
            type: 'text',
            content: content,
        })
    }

    return blocks
}

/**
 * Extract only code blocks from content (legacy format)
 */
export function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    const blocks: Array<{ language: string; code: string }> = []
    let match

    while ((match = regex.exec(content)) !== null) {
        blocks.push({
            language: match[1] || 'plaintext',
            code: match[2].trim(),
        })
    }

    return blocks
}

/**
 * Get language label for display
 */
export function getLanguageLabel(language: string): string {
    const labels: Record<string, string> = {
        js: 'JavaScript',
        ts: 'TypeScript',
        jsx: 'React JSX',
        tsx: 'React TSX',
        py: 'Python',
        python: 'Python',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        cs: 'C#',
        go: 'Go',
        rs: 'Rust',
        rb: 'Ruby',
        php: 'PHP',
        swift: 'Swift',
        kt: 'Kotlin',
        sh: 'Shell',
        bash: 'Bash',
        sql: 'SQL',
        html: 'HTML',
        css: 'CSS',
        json: 'JSON',
        yaml: 'YAML',
        xml: 'XML',
        md: 'Markdown',
        plaintext: 'Plain Text',
    }

    return labels[language.toLowerCase()] || language.toUpperCase()
}

// ============================================================================
// Local Storage Utilities
// ============================================================================

/**
 * Safe localStorage get with fallback
 */
export function getFromLocalStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback

    try {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : fallback
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error)
        return fallback
    }
}

/**
 * Safe localStorage set
 */
export function saveToLocalStorage<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false

    try {
        window.localStorage.setItem(key, JSON.stringify(value))
        return true
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error)
        return false
    }
}

/**
 * Remove item from localStorage
 */
export function removeFromLocalStorage(key: string): boolean {
    if (typeof window === 'undefined') return false

    try {
        window.localStorage.removeItem(key)
        return true
    } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error)
        return false
    }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if string is valid URL
 */
export function isValidUrl(str: string): boolean {
    try {
        new URL(str)
        return true
    } catch {
        return false
    }
}

/**
 * Check if environment is browser
 */
export function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

/**
 * Check if environment is server
 */
export function isServer(): boolean {
    return typeof window === 'undefined'
}

// ============================================================================
// Copy to Clipboard
// ============================================================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    if (!isBrowser()) return false

    try {
        // Modern clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
            return true
        }

        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        return success
    } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        return false
    }
}

// ============================================================================
// Debounce & Throttle
// ============================================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}