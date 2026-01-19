# TODO List

- [x] **Phase 1: Project Initialization**
  - [x] Scaffold Next.js (manual, no server storage).
  - [x] Set dev server `0.0.0.0:3001`.
  - [x] Add Tailwind + fonts (Playfair Display, Inter).

- [x] **Phase 2: Data Layer (IndexedDB)**
  - [x] Create `src/lib/db.ts` with Dexie schema.
  - [x] Implement `useTopic` and `useMapData` hooks.

- [x] **Phase 3: AI Backend (Genkit)**
  - [x] Create Genkit config and flow with Zod output.
  - [x] Server Action `expandNodeAction`.

- [x] **Phase 4: UI + Graph**
  - [x] Create `NYTNode` component.
  - [x] Build React Flow canvas.
  - [x] Local layout algorithm.
  - [x] Toolbar with edge/node style toggles.

- [x] **Phase 5: Export / Import**
  - [x] Export mind map JSON.
  - [x] Import JSON with validation.
