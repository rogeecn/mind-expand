# UI Layout & Composition Guidelines

## 1. Global Layout Structure (App Shell)

The application follows a **"Canvas-First"** approach. The interface is immersive, with UI controls floating above the infinite workspace rather than boxing it in.

### 1.1 The Viewport Layers
*   **Layer 0 (Base):** The Infinite Canvas (`ReactFlow` instance). Background color `#F9F9F7` (Paper).
*   **Layer 1 (Overlay UI):** Floating controls, non-blocking.
*   **Layer 2 (Modals/Dialogs):** Blocking interactions (e.g., Settings, Export).

### 1.2 Layout Grid (The "Newspaper" Frame)
Even though the canvas is infinite, the UI controls act as the "Frame".

```
+-------------------------------------------------------+
|  [Top-Left]       [Top-Center]          [Top-Right]   |
|  Brand/Home       Current Topic         User/Settings |
|                                                       |
|                                                       |
|                  (Infinite Canvas)                    |
|                                                       |
|                                                       |
|  [Bottom-Left]    [Bottom-Center]       [Bottom-Right]|
|  History/Nav      Main Toolbar          Zoom/Map      |
+-------------------------------------------------------+
```

---

## 2. Component Placement Strategy

### 2.1 Top Bar (The Header)
*   **Position:** Fixed Top, Full Width, `h-16`.
*   **Style:** Transparent gradient backdrop OR solid thin border bottom (`border-b border-gray-200`).
*   **Elements:**
    *   **Left:** "Mind Expand" Logo (Serif, Black). clickable -> returns to dashboard.
    *   **Center:** Breadcrumbs of current active path (e.g., `Coffee > Origins > Ethiopia`).
        *   *Interaction:* Click breadcrumb to jump/focus camera to that node.
    *   **Right:** `Export` button (Outline style), `Theme` toggle.

### 2.2 The Main Toolbar (The Dock)
*   **Position:** Bottom Center (`bottom-8`, centered `left-1/2 -translate-x-1/2`).
*   **Style:**
    *   Capsule shape (Pill).
    *   Background: `bg-white/90` (Blur backdrop).
    *   Border: `border border-gray-200`.
    *   Shadow: `shadow-lg` (Soft diffuse).
*   **Controls:**
    *   [Undo/Redo] | [Layout Switch: Curve/Step] | [Style: Card/Text] | [Fit View]

### 2.3 Side Panel (History/Topics) - *Collapsible*
*   **Position:** Fixed Left (`top-0 bottom-0 left-0`).
*   **Width:** `w-64` (256px).
*   **State:** Default collapsed (showing only icon strip) to maximize canvas. Expands on hover or click.
*   **Content:**
    *   List of past mind maps.
    *   Grouped by Date (Today, Yesterday).
    *   Style: Clean list, hover highlights `bg-gray-100`.

---

## 3. Responsive Adaptations

### 3.1 Mobile Layout (< 768px)
*   **Top Bar:** Simplifies to Logo (Left) and Menu Burger (Right).
*   **Toolbar:** Moves to **Bottom Full Width** (Fixed footer).
*   **Sidebar:** Becomes a full-screen Drawer (Slide-over).
*   **Canvas:** Touch gestures enabled. Tap-to-select instead of hover.

### 3.2 Desktop Layout (> 1024px)
*   **Sidebar:** Can be pinned open for "Research Mode".
*   **Mini-Map:** Appears in Bottom-Right corner (`bottom-8 right-8`) for navigation context.

---

## 4. Node Internal Layout (The Card Micro-Layout)

Inside the `NYTNode`:

```
+-----------------------------+
|  [Title: Serif, Bold 16px]  |
|  -------------------------  | (Spacing: mb-2)
|  [Desc: Sans, Reg 12px]     |
|  [Color: Gray-600]          |
|                             |
|           [ (+) ]           | (Expand Handle: Right/Bottom)
+-----------------------------+
```

*   **Padding:** `p-4` (Generous).
*   **Width:** Fixed `w-64` (256px) or Auto-width with `max-w-md`.
*   **Handles (React Flow):**
    *   Input: Left center (hidden, target area only).
    *   Output: Right center (visible when hovered).

## 5. Z-Index Management (Tailwind Classes)
*   `z-0`: Background Pattern (Dots/Grid).
*   `z-10`: React Flow Edges.
*   `z-20`: React Flow Nodes.
*   `z-30`: Floating Toolbar.
*   `z-40`: Sidebar / Header.
*   `z-50`: Modals / Popovers.
