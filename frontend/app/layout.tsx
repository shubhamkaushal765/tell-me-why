import type {Metadata} from 'next'
import ThemeRegistry from '@/components/ThemeRegistry'
import {Providers} from './providers'
import './globals.css'

export const metadata: Metadata = {
    title: 'Tell Me Why - RAG Code Assistant',
    description: 'Privacy-preserving RAG system for code assistance. Your code stays local.',
    keywords: ['RAG', 'code assistant', 'AI', 'privacy', 'local', 'Ollama', 'Claude'],
}

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com"
                  crossOrigin="anonymous"/>
        </head>
        <body>
        <ThemeRegistry>
            <Providers>
                {children}
            </Providers>
        </ThemeRegistry>
        </body>
        </html>
    )
}