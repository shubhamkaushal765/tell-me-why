# Next.js Frontend Integration Guide

This document provides a high-level outline for building a Next.js frontend to interact with the RAG Code Assistant API.

## 📁 Project Structure

### Recommended Structure (App Router)

```
nextjs-frontend/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Home page with chat interface
│   ├── globals.css               # Global styles
│   └── api/
│       └── query/
│           └── route.ts          # Optional: Proxy to backend API
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx     # Main chat UI
│   │   ├── MessageList.tsx       # Display messages
│   │   ├── MessageInput.tsx      # Input form
│   │   └── CodeBlock.tsx         # Syntax-highlighted code display
│   ├── ui/
│   │   ├── Button.tsx            # Reusable button
│   │   ├── Select.tsx            # Model selector dropdown
│   │   └── LoadingSpinner.tsx   # Loading indicator
│   └── layout/
│       ├── Header.tsx            # App header
│       └── Sidebar.tsx           # Optional: Settings/history
├── lib/
│   ├── api.ts                    # API client functions
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── hooks/
│   ├── useChat.ts                # Custom hook for chat logic
│   └── useLocalStorage.ts        # Persist chat history
├── public/
│   └── logo.svg
├── package.json
├── tsconfig.json
└── next.config.js
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

## 🔧 Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest nextjs-frontend --typescript --tailwind --app
cd nextjs-frontend
```

### 2. Install Dependencies

```bash
npm install axios
npm install @types/node @types/react @types/react-dom --save-dev

# Optional but recommended
npm install react-syntax-highlighter @types/react-syntax-highlighter
npm install react-markdown
npm install zustand  # For state management
```

### 3. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📝 Core Components

### API Client (`lib/api.ts`)

```typescript
// lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface QueryRequest {
  query: string;
  llm_type: 'ollama' | 'claude';
}

export interface Source {
  content: string;
  metadata: {
    source: string;
    source_type: string;
    file_type: string;
  };
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  llm_type: string;
  privacy_note: string;
}

export const queryRAG = async (request: QueryRequest): Promise<QueryResponse> => {
  const response = await axios.post<QueryResponse>(`${API_URL}/query`, request);
  return response.data;
};

export const getStats = async () => {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
};

export const getModels = async () => {
  const response = await axios.get(`${API_URL}/models`);
  return response.data;
};
```

### Types (`lib/types.ts`)

```typescript
// lib/types.ts
export type LLMType = 'ollama' | 'claude';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  llm_type?: LLMType;
  privacy_note?: string;
}

export interface Source {
  content: string;
  metadata: {
    source: string;
    source_type: string;
    file_type: string;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  selectedModel: LLMType;
}
```

### Custom Hook (`hooks/useChat.ts`)

```typescript
// hooks/useChat.ts
import { useState, useCallback } from 'react';
import { queryRAG } from '@/lib/api';
import { Message, LLMType } from '@/lib/types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMType>('ollama');

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Query the RAG API
      const response = await queryRAG({
        query: content,
        llm_type: selectedModel,
      });

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        llm_type: response.llm_type,
        privacy_note: response.privacy_note,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Handle error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearMessages,
  };
};
```

### Main Chat Interface (`components/chat/ChatInterface.tsx`)

```typescript
// components/chat/ChatInterface.tsx
'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';

export default function ChatInterface() {
  const { messages, isLoading, selectedModel, setSelectedModel, sendMessage, clearMessages } = useChat();

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">RAG Code Assistant</h1>
        <div className="flex gap-2">
          <ModelSelector 
            value={selectedModel} 
            onChange={setSelectedModel} 
          />
          <button 
            onClick={clearMessages}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

### Message List (`components/chat/MessageList.tsx`)

```typescript
// components/chat/MessageList.tsx
import { Message } from '@/lib/types';
import CodeBlock from './CodeBlock';

interface Props {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: Props) {
  return (
    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-4 rounded-lg ${
            message.role === 'user' 
              ? 'bg-blue-50 ml-auto max-w-[80%]' 
              : 'bg-gray-50 mr-auto max-w-[80%]'
          }`}
        >
          <div className="font-semibold mb-2">
            {message.role === 'user' ? 'You' : 'Assistant'}
          </div>
          
          <div className="prose prose-sm max-w-none">
            <CodeBlock content={message.content} />
          </div>

          {message.privacy_note && (
            <div className="mt-2 text-xs text-gray-600 italic">
              {message.privacy_note}
            </div>
          )}

          {message.sources && message.sources.length > 0 && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-gray-600">
                Sources ({message.sources.length})
              </summary>
              <div className="mt-2 space-y-2">
                {message.sources.map((source, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border">
                    <div className="font-mono text-xs text-gray-500">
                      {source.metadata.source}
                    </div>
                    <div className="mt-1 text-gray-700">
                      {source.content}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}
```

### Message Input (`components/chat/MessageInput.tsx`)

```typescript
// components/chat/MessageInput.tsx
'use client';

import { useState, FormEvent } from 'react';

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about your code, request components, or debug..."
        disabled={disabled}
        className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
```

### Model Selector (`components/chat/ModelSelector.tsx`)

```typescript
// components/chat/ModelSelector.tsx
import { LLMType } from '@/lib/types';

interface Props {
  value: LLMType;
  onChange: (value: LLMType) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LLMType)}
      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="ollama">
        🔒 Ollama (Private)
      </option>
      <option value="claude">
        ☁️ Claude (Cloud)
      </option>
    </select>
  );
}
```

### Code Block with Syntax Highlighting (`components/chat/CodeBlock.tsx`)

```typescript
// components/chat/CodeBlock.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  content: string;
}

export default function CodeBlock({ content }: Props) {
  // Simple code block detection (look for ```language)
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push(
        <p key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </p>
      );
    }

    // Add code block
    const language = match[1] || 'typescript';
    const code = match[2].trim();
    parts.push(
      <SyntaxHighlighter
        key={`code-${match.index}`}
        language={language}
        style={vscDarkPlus}
        customStyle={{ borderRadius: '0.5rem', padding: '1rem' }}
      >
        {code}
      </SyntaxHighlighter>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <p key={`text-${lastIndex}`}>
        {content.substring(lastIndex)}
      </p>
    );
  }

  return <div>{parts.length > 0 ? parts : <p>{content}</p>}</div>;
}
```

### Main Page (`app/page.tsx`)

```typescript
// app/page.tsx
import ChatInterface from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <ChatInterface />
    </main>
  );
}
```

## 🎨 Styling Tips

### Tailwind Configuration

The examples above use Tailwind CSS. Customize your `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            code: {
              backgroundColor: '#f3f4f6',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
```

## 🚀 Running the Frontend

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000`

## 🔄 State Management (Optional)

For more complex apps, consider Zustand:

```typescript
// lib/store.ts
import { create } from 'zustand';
import { Message, LLMType } from './types';

interface ChatStore {
  messages: Message[];
  selectedModel: LLMType;
  addMessage: (message: Message) => void;
  setSelectedModel: (model: LLMType) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  selectedModel: 'ollama',
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setSelectedModel: (model) => set({ selectedModel: model }),
  clearMessages: () => set({ messages: [] }),
}));
```

## 📱 Additional Features to Consider

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

2. **Environment Variables**
    - Never commit `.env.local`
    - Use `NEXT_PUBLIC_` prefix only for client-side vars

3. **Input Validation**
    - Sanitize user inputs
    - Limit message length
    - Rate limiting on API calls

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Happy Coding! 🚀**