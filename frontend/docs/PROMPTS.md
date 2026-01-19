You are a senior full-stack engineer experienced with Next.js 15 App Router +
TypeScript + Material UI (MUI v5 / @mui/material) in production apps connected
to Python backends (FastAPI).

I want clean, modern, production-grade code with excellent DX.

Task: Build Next.js frontend that consumes my Python backend.

Must-have:

- Next.js 15 / App Router (NOT pages router)
- TypeScript — strict + no any
- Use fetch() with proper Response/Request typing (no axios unless forced)
- Correct SSR/Emotion cache setup for MUI → NO FOUC, styles in <head>
- Use @mui/material-nextjs AppRouterCacheProvider (latest version)
- ThemeProvider + custom theme (light/dark mode support — respect system
  preference)
- CssBaseline included
- Proper error boundaries / loading states / Suspense
- Use next/navigation hooks
- Route Handlers in app/api/... when needed
- Folder structure following 2025–2026 App Router best practices
- Authentication: [JWT Bearer / HttpOnly cookie session / none — specify yours]
- Env vars: .env + NEXT_PUBLIC_ prefix where appropriate
- Prefer server components; "use client" only when necessary (forms,
  interactivity, browser APIs)
- Use MUI components (Button, TextField, Card, DataGrid if needed, etc.)
- Zod for runtime API response validation + type inference (or infer from fetch
  generics)
- Good UX: skeletons/loading indicators, error alerts/snackbars (use notistack
  or MUI Snackbar)
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
6. Authentication setup example (context/provider + protected layout or
   middleware)
7. One public page (login) + one protected page (dashboard with data fetch)
8. Example: server component fetching data + client component with
   form/interaction
9. Optional: global error boundary + loading.tsx pattern

Be pragmatic — avoid crazy abstraction.  
Write clean, senior-level code that passes code review.  
Follow official MUI Next.js App Router guide pattern (AppRouterCacheProvider
etc.).

Start now.