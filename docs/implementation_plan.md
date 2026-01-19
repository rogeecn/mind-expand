# Recursive AI Mind Map - Implementation Plan

## 1. Project Overview
A recursive mind map application that expands topics via AI and stores everything locally in IndexedDB.

**Key Requirements**
- Local-only persistence (IndexedDB via Dexie). No server storage or DB.
- Context-aware AI expansion (Root Topic + Breadcrumb Path).
- Partial expansion (local layout only, no global reflow).
- Export and import of mind map data.
- NYT-style UI (serif headings, high contrast, sharp edges).
- Dev server runs on `0.0.0.0:3001`.

## 2. Architecture & Tech Stack

### Frontend Framework
- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS + clsx + tailwind-merge

### AI Integration
- Genkit (Firebase Genkit)
- Zod schemas for structured output
- Server Actions for AI flows

### Visualization
- React Flow
- Custom node components (NYTNode)
- Local layout algorithm
- Edge style toggle (Bezier/Step)

### Persistence
- Dexie.js (IndexedDB)
- Normalized schema: `topics`, `nodes`, `edges`

## 3. Functional Scope

### Core Flow
1. Create Topic (Root Node)
2. Click Node -> AI generates N children
3. Local layout places children near parent
4. Persist to IndexedDB immediately

### Export/Import
- Export current topic as JSON
- Import JSON to restore a topic map

## 4. Execution Phases

### Phase 1: Project Initialization
- Manual Next.js scaffold
- Dev server port set to 3001
- Tailwind setup + fonts

### Phase 2: Data Layer
- Dexie schema
- Hooks: useTopic, useMapData

### Phase 3: AI Backend
- Genkit flow + Zod schemas
- Server Action: expandNodeAction

### Phase 4: UI + Graph
- React Flow canvas
- NYTNode and edge types
- Toolbar (layout/style toggles)

### Phase 5: Export/Import
- JSON export
- JSON import
- Validation
