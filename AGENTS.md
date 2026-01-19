# AGENTS.md - Operational Directives

## ⚠️ CRITICAL: Development Protocol

**ALL Development must strictly follow the roadmap defined in `docs/todo_list.md`.**
Do not deviate from the order of phases or tasks unless explicitly instructed by the user. Mark tasks as completed in that file as you progress.

---

## 1. Technical Constraints & Stack

You are building a recursive AI Mind Map application. You must adhere to this specific stack:

*   **Framework:** Next.js 14+ (App Router). Use Server Actions for all backend logic.
*   **Language:** TypeScript (Strict mode).
*   **AI Engine:** **Genkit** (Firebase Genkit).
    *   MUST use Zod schemas for structured output.
    *   MUST use context-aware prompts (Root Topic + Breadcrumb Path).
*   **Visualization:** **React Flow**.
    *   Use custom node components (`NYTNode`).
    *   Implement **Local Layout** algorithms (do not use global auto-layout engines like Dagre/Elk unless confined to a specific branch).
*   **Persistence:** **Dexie.js** (IndexedDB).
    *   Store data locally first.
    *   Schema must be normalized (flat `nodes` and `edges` tables, not nested JSON).
*   **Styling:** Tailwind CSS + `clsx` + `tailwind-merge`.

## 2. Reference Standards (MUST READ)

Before implementing any UI or Layout, you **MUST** consult these guidelines to ensure the "New York Times" aesthetic:

*   **Visual Style:** `docs/ui_design_guidelines.md` (Typography, Colors, Component States).
*   **Layout Structure:** `docs/ui_layout_guidelines.md` (Global Grid, Z-Index, Component Placement).

**Key Design Axioms:**
*   **Serif Headings (Playfair Display)** for authority.
*   **High Contrast** (Black/White).
*   **Sharp Edges** (0-2px radius).
*   **Partial Expansion** (Local layout updates only).

## 3. Interaction Principles

*   **Partial Expansion:** When a node is expanded, ONLY generate its immediate children and place them locally. DO NOT trigger a global graph re-layout that shifts existing nodes.
*   **Context Safety:** Never send a prompt to the AI without the "Root Context" and the "Path History" to prevent hallucinations.
*   **Persistence:** All state changes (add node, move node) must be immediately persisted to IndexedDB.

## 4. File Structure Conventions

*   `src/app/actions/*`: Server Actions (Genkit flows).
*   `src/lib/db.ts`: Dexie database definition.
*   `src/components/map/*`: React Flow specific components (Nodes, Edges, Toolbar).
*   `src/hooks/*`: Custom hooks for data fetching (`useMapData`, `useTopic`).

## 5. Behavior

*   **Check First:** Before implementing a feature, read the relevant section in `docs/implementation_plan.md`.
*   **Verify:** After writing code, run build checks (`npm run build` or `tsc`) to ensure type safety.
