# UI/UX Design Guidelines: "The Expanding Mind"

## 1. Aesthetic Direction: "Editorial Precision" (The New York Times Meets Data Art)

**Core Philosophy:**
The interface should feel like an interactive, living editorial piece. It is not a tool; it is a canvas for thought. The design must be **authoritative, sharp, and focused**. We reject the "SaaS look" (soft shadows, blue primaries, rounded corners) in favor of **high-contrast clarity**.

### 1.1 Typography (The Soul)
Typography is the primary interface.
*   **Headline / Nodes (Serif):** `Playfair Display` (Google Fonts).
    *   Used for: Node titles, critical modal headers.
    *   Weight: Bold (700) or Black (900).
    *   Feeling: Intellectual, grounded, classic.
*   **Body / Meta (Sans-Serif):** `Inter` or `Geist Sans`.
    *   Used for: Descriptions, UI controls, breadcrumbs.
    *   Weight: Regular (400) for reading, Medium (500) for controls.
    *   Tracking: Slightly tight (-0.01em) for a modern, dense feel.

### 1.2 Color Palette (High Contrast)
*   **Canvas:** `#F9F9F7` (Off-white, paper-like warm tone) or `#FFFFFF` (Stark white).
*   **Ink (Primary):** `#121212` (Not pure black, but deep charcoal).
*   **Accent (Action):** `#000000` (Pure black) or a very deep, muted Crimson `#8B0000` (for active states/errors).
*   **Subtle:** `#E5E5E5` (Borders), `#777777` (Secondary text).
*   **Dark Mode (Inverted):** Deep matte black background (`#0A0A0A`), Ivory text (`#F5F5F0`).

## 2. Component Design

### 2.1 The Node (The Card)
Avoid the "bubble" look. The node is a data card.
*   **Shape:** Rectangular. `border-radius: 2px` (Almost sharp, just soft enough to not cut).
*   **Border:** `1px solid #E5E5E5`.
*   **State - Default:** White background, Black text.
*   **State - Hover:** Shadow `0 4px 12px rgba(0,0,0,0.08)` (Subtle lift). Border darkens to `#999`.
*   **State - Selected:** **Invert.** Black background, White text. This creates a strong "focal point" on the active thought.
*   **Content:**
    *   Top: Title (Serif, lg).
    *   Bottom: Description (Sans, sm, gray, max-lines-2).
    *   Right Edge: A subtle `+` indicator if expandable.

### 2.2 The Connections (The Edges)
*   **Style 1: Structured (Default):** Step/Orthogonal lines. `stroke-width: 1px`. Color `#CCCCCC`. Looks like a family tree or circuit.
*   **Style 2: Organic:** Bezier curves. Use for "Brainstorming" mode.
*   **Animation:** When a new path forms, the line should "draw" itself from source to target (SVG `stroke-dashoffset` animation).

### 2.3 The Controls (Toolbar)
Floating, minimal, detached.
*   **Position:** Bottom center or Top right (fixed).
*   **Style:** Glassmorphism or solid black pill.
*   **Icons:** Thin stroke icons (Lucide-react), stroke width 1.5px.

## 3. Interaction & Motion

### 3.1 The "Expansion" Moment (The Core Joy)
1.  **Click:** The node clicks down (scale 0.98).
2.  **Think:** The node pulses subtly or shows a small, elegant loading spinner (serif asterisk spinning?).
3.  **Reveal:**
    *   New nodes **fade in + slide out** from the parent's position.
    *   Staggered delay: Node 1 (0ms), Node 2 (50ms), Node 3 (100ms).
    *   **NO Layout Shift:** The canvas gently pans to center the new cluster, but old nodes stay firm.

### 3.2 Context Menu
*   Right-click on node.
*   Options: "Regenerate" (Refresh icon), "Prune" (Scissors icon), "Focus" (Eye icon).
*   Style: Simple white list, strict borders, no icons unless necessary.

## 4. Implementation Details (Tailwind Config)

```javascript
// tailwind.config.ts preview
theme: {
  extend: {
    fontFamily: {
      serif: ['var(--font-playfair)', 'serif'],
      sans: ['var(--font-inter)', 'sans-serif'],
    },
    colors: {
      paper: '#F9F9F7',
      ink: '#121212',
    },
    boxShadow: {
      'editorial': '0 2px 0 0 rgba(0,0,0,1)', // Hard shadow option
    }
  }
}
```

## 5. Mobile Considerations
*   **Canvas:** Pan/Zoom is harder on mobile.
*   **Cards:** Simplify. Maybe hide descriptions on mobile, show only titles until zoomed in.
*   **Controls:** Bottom bar is essential.

This document serves as the "Visual Constitution" for the project. All UI decisions must cross-reference this.
