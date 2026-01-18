# Next.js Frontend Integration Guide

This document provides a high-level outline for building a Next.js frontend to interact with the RAG Code Assistant API.

## 📁 Project Structure

### Recommended Structure (App Router)

```
tell-me-why-frontend/
├── app/
│   ├── layout.tsx              # Root layout with ThemeRegistry
│   ├── page.tsx                # Home page with chat interface
│   ├── loading.tsx             # Loading UI
│   ├── error.tsx               # Error boundary
│   ├── globals.css             # Global styles
│   └── api/
│       └── query/
│           └── route.ts        # API proxy (optional)
├── components/
│   ├── ThemeRegistry.tsx       # MUI theme + SSR setup
│   ├── chat/
│   │   ├── ChatInterface.tsx   # Main chat container
│   │   ├── MessageBubble.tsx   # Individual message display
│   │   ├── MessageInput.tsx    # User input form
│   │   └── CodeBlock.tsx       # Syntax-highlighted code
│   └── layout/
│       └── Header.tsx          # App header with theme toggle
├── hooks/
│   └── useChat.ts              # Chat state management
├── lib/
│   ├── api.ts                  # API client with error handling
│   ├── types.ts                # TypeScript types + Zod schemas
│   ├── theme.ts                # MUI theme configuration
│   └── utils.ts                # Utility functions
├── package.json
├── tsconfig.json
├── next.config.mjs
└── .env.local.example
```

### Alternative: Pages Router

```
nextjs-frontend/
├── pages/
│   ├── _app.tsx                  # App wrapper
│   ├── index.tsx                 # Home page
│   └── api/
│       └── query.ts              # API route proxy
├── components/                   # Same as above
├── lib/                         # Same as above
└── styles/
    └── globals.css
```

## 📱 Additional Features

1. **Chat History Persistence**

- Use `localStorage` or a backend database
- Implement in `hooks/useLocalStorage.ts`

2. **Example Prompts**

- Quick start buttons with common queries
- "Generate login component", "Explain auth", etc.

3. **Settings Panel**

- API endpoint configuration
- Theme toggle (dark mode)
- Model preferences

4. **Export Functionality**

- Export chat as Markdown
- Copy code blocks with one click

5. **Multi-tab Support**

- Multiple concurrent chats
- Chat history sidebar

6. **Error Handling**

- Toast notifications for errors
- Retry mechanisms
- Connection status indicator

## 🔒 Security Considerations

1. **API Proxy** (Optional but Recommended)

- Don't expose backend URL directly
- Use Next.js API routes as proxy

```typescript
// app/api/query/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const response = await fetch('http://localhost:8000/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

2. **Input Validation**

- Sanitize user inputs
- Limit message length
- Rate limiting on API calls

---

You are a senior full-stack engineer experienced with Next.js 15 App Router + TypeScript + Material UI (MUI v5 /
@mui/material) in production apps connected to Python backends (FastAPI).

I want clean, modern, production-grade code with excellent DX.

Task: Build Next.js frontend that consumes my Python backend.

Must-have:

- Next.js 15 / App Router (NOT pages router)
- TypeScript — strict + no any
- Use fetch() with proper Response/Request typing (no axios unless forced)
- Correct SSR/Emotion cache setup for MUI → NO FOUC, styles in <head>
- Use @mui/material-nextjs AppRouterCacheProvider (latest version)
- ThemeProvider + custom theme (light/dark mode support — respect system preference)
- CssBaseline included
- Proper error boundaries / loading states / Suspense
- Use next/navigation hooks
- Route Handlers in app/api/... when needed
- Folder structure following 2025–2026 App Router best practices
- Authentication: [JWT Bearer / HttpOnly cookie session / none — specify yours]
- Env vars: .env + NEXT_PUBLIC_ prefix where appropriate
- Prefer server components; "use client" only when necessary (forms, interactivity, browser APIs)
- Use MUI components (Button, TextField, Card, DataGrid if needed, etc.)
- Zod for runtime API response validation + type inference (or infer from fetch generics)
- Good UX: skeletons/loading indicators, error alerts/snackbars (use notistack or MUI Snackbar)
- Optimistic UI + revalidation when it makes sense

Backend:

- Runs at: http://localhost:8000 (production URL changes later)
- API prefix: /api/v1
- Backend API is attached in separate file.

Generate:

1. Clear folder structure (tree)
2. Key config files (next.config.mjs, tsconfig.json, package.json dependencies)
3. Theme setup (custom theme + dark mode toggle if possible)
4. ThemeRegistry.tsx or equivalent (Emotion cache + ThemeProvider wrapper)
5. app/layout.tsx (with AppRouterCacheProvider, CssBaseline, etc.)
6. Authentication setup example (context/provider + protected layout or middleware)
7. One public page (login) + one protected page (dashboard with data fetch)
8. Example: server component fetching data + client component with form/interaction
9. Optional: global error boundary + loading.tsx pattern

Be pragmatic — avoid crazy abstraction.  
Write clean, senior-level code that passes code review.  
Follow official MUI Next.js App Router guide pattern (AppRouterCacheProvider etc.).

Start now.