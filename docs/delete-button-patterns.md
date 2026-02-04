# Delete Button UI/UX Patterns Research
## Editorial & Productivity Apps

**Research Date:** Feb 4, 2026  
**Context:** NYT-style Mind Map sidebar list items

---

## 1. Pattern Analysis from Leading Apps

### 1.1 **NYT Digital Products** (Editorial Standard)
- **Pattern:** No visible delete in reading lists - "Archive" instead
- **Rationale:** Content preservation over destruction
- **Implementation:** Swipe-left on mobile reveals "Archive" action
- **Desktop:** Right-click context menu or hover-reveal three-dot menu
- **Key Principle:** Destructive actions are **secondary** to primary reading flow

### 1.2 **Notion** (Productivity Reference)
- **Pattern:** Hover-reveal three-dot menu → Delete option
- **Location:** Right edge of list item
- **Behavior:**
  - Icon appears on hover (opacity transition)
  - Click opens dropdown menu
  - Delete is **last item** in menu (red text)
  - Confirmation modal for important items
- **Visual:** Subtle gray dots → black on hover → menu overlay

### 1.3 **Medium** (Editorial Platform)
- **Pattern:** Hover-reveal action bar
- **Desktop:** 
  - Three-dot menu appears on right on hover
  - "Remove from list" (not "Delete") - softer language
- **Mobile:** 
  - Long-press context menu
  - Swipe actions disabled (too easy to trigger accidentally)

### 1.4 **Apple Notes / Reminders**
- **Pattern:** Swipe-to-delete (iOS standard)
- **Desktop:** Hover-reveal delete icon OR context menu
- **Key Feature:** 
  - Partial swipe shows action
  - Full swipe executes immediately
  - Undo toast appears after deletion

### 1.5 **Linear** (Modern Productivity)
- **Pattern:** Keyboard-first with visual fallback
- **Behavior:**
  - Hover shows subtle highlight + actions fade in
  - Delete icon only visible on hover
  - Keyboard: `Backspace` or `Delete` key when focused
  - No confirmation for individual items (has undo)

---

## 2. Common Patterns Categorized

### 2.A **Hover-Reveal Icon** ✅ Most Common
**When to use:** Dense lists, power users, clean aesthetic

**Pros:**
- Keeps UI clean when idle
- Familiar pattern (Gmail, Notion, Slack)
- Works well with keyboard navigation

**Cons:**
- Not discoverable on mobile
- Requires precise hover target

**Implementation:**
```tsx
<div className="group relative">
  <div className="content">Item Title</div>
  <button 
    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
    aria-label="Delete"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</div>
```

**NYT Aesthetic Adaptation:**
- Use sharp edges (no rounded delete button)
- Black icon, not red (red only on hover/focus)
- Position: absolute right, vertically centered
- Transition: opacity 150ms ease-out

---

### 2.B **Three-Dot Menu (Overflow Menu)** ✅ Recommended for Editorial
**When to use:** Multiple actions possible, formal interfaces

**Pros:**
- Standard pattern (NYT uses this in article lists)
- Scalable (can add more actions later)
- Less aggressive than direct delete icon

**Cons:**
- Requires two clicks
- Slightly slower for frequent deletions

**Implementation:**
```tsx
// Hover reveals dots → Click shows dropdown
<Popover>
  <PopoverTrigger className="opacity-0 group-hover:opacity-100">
    <MoreVertical className="h-4 w-4" />
  </PopoverTrigger>
  <PopoverContent align="end">
    <button className="text-red-600">Delete Topic</button>
  </PopoverContent>
</Popover>
```

**NYT Aesthetic:**
- Vertical dots (3 circles, 2px each, 4px spacing)
- Menu: White background, 1px black border, sharp corners
- Delete option: Last in list, normal weight, red text on hover
- No icons in menu (text only for clarity)

---

### 2.C **Swipe Actions** (Mobile Only)
**When to use:** Native mobile apps, touch-first interfaces

**Pros:**
- Fast, gestural, feels native
- Doesn't clutter UI

**Cons:**
- Desktop requires different pattern
- Can be triggered accidentally
- Not suitable for web-first apps

**Recommendation:** **Skip for this project** (web-first, NYT aesthetic is precise, not gestural)

---

### 2.D **Context Menu (Right-Click)** ✅ Good Secondary Option
**When to use:** Power users, desktop-first

**Pros:**
- No UI clutter
- Familiar to desktop users
- Can include many actions

**Cons:**
- Not discoverable
- Mobile requires long-press (awkward)

**Implementation:**
```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <div>List Item</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem className="text-red-600">
      Delete Topic
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

### 2.E **Inline Persistent Icon** ❌ Not Recommended
**Why NYT avoids this:**
- Clutters clean editorial aesthetic
- Implies content is disposable (wrong message)
- Used by todo apps (Todoist), not editorial tools

---

## 3. Best Practice Principles

### 3.1 **Visual Hierarchy**
1. **Primary Action:** Select/Open (entire item clickable)
2. **Secondary Action:** Edit/Manage (hover-reveal menu)
3. **Destructive Action:** Delete (nested in menu, red text)

### 3.2 **Progressive Disclosure**
- Idle state: No delete visible
- Hover state: Menu trigger appears
- Opened state: Delete option visible in dropdown
- Confirmation: Modal for important data

### 3.3 **Accessibility Requirements**
- Keyboard: `Tab` to item → `Enter` to open menu → Arrow keys to navigate → `Enter` to confirm
- Screen reader: "Delete [Topic Name]" button with proper ARIA labels
- Focus visible: 2px outline on focus (not just hover)

### 3.4 **Undo Safety**
**Two approaches:**
1. **Soft Delete** (Recommended for editorial)
   - Item moves to "Archive" or "Deleted Items"
   - Can be restored within 30 days
   - Permanent deletion happens automatically

2. **Toast Undo** (Recommended for this app)
   - Delete executes immediately
   - Toast appears: "Topic deleted. [Undo]"
   - Undo available for 5 seconds
   - Matches IndexedDB transaction pattern

---

## 4. Recommendation for Mind Expand

### **Primary Pattern: Hover-Reveal Three-Dot Menu**

**Rationale:**
- Aligns with NYT editorial aesthetic (precise, not aggressive)
- Scalable (can add "Duplicate", "Export" later)
- Clean idle state (no visual clutter)
- Accessible (keyboard + mouse)

**Visual Spec:**
```
Idle State:
┌────────────────────────────────┐
│ #01 Coffee Origins             │ ← Active indicator (4px black bar left)
│ Exploration of coffee...       │
│ Feb 4, 1:30 PM                 │
└────────────────────────────────┘

Hover State:
┌────────────────────────────────┐
│ #01 Coffee Origins          ⋮  │ ← Three dots fade in (right edge)
│ Exploration of coffee...       │
│ Feb 4, 1:30 PM                 │
└────────────────────────────────┘

Menu Open:
┌────────────────────────────────┐
│ #01 Coffee Origins          ⋮  │
│ Exploration of coffee...    ┌──┴──────────────┐
│ Feb 4, 1:30 PM              │ Rename Topic    │
│                             │ Export Backup   │
│                             │ ─────────────── │ ← Divider
│                             │ Delete          │ ← Red text
│                             └─────────────────┘
└────────────────────────────────┘
```

### **Implementation Strategy**

**Step 1: Add Three-Dot Button**
```tsx
// In TopicSidebar.tsx list item
<button
  type="button"
  className={clsx(
    "absolute right-2 top-1/2 -translate-y-1/2",
    "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
    "text-gray-400 hover:text-ink"
  )}
  onClick={(e) => {
    e.stopPropagation(); // Don't trigger topic selection
    setMenuOpen(topic.id);
  }}
>
  <MoreVertical className="h-4 w-4" />
</button>
```

**Step 2: Dropdown Menu (Radix UI Dropdown)**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    {/* Three-dot button */}
  </DropdownMenuTrigger>
  <DropdownMenuContent 
    align="end" 
    className="w-48 border border-gray-200 bg-white shadow-lg"
  >
    <DropdownMenuItem onClick={() => handleRename(topic.id)}>
      Rename Topic
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleExport(topic.id)}>
      Export Backup
    </DropdownMenuItem>
    <DropdownMenuSeparator className="bg-gray-100" />
    <DropdownMenuItem 
      onClick={() => handleDelete(topic.id)}
      className="text-red-600 focus:text-red-700"
    >
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Step 3: Confirmation Modal**
```tsx
// Simple confirmation for destructive action
<Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
  <h3 className="font-serif text-xl font-bold text-ink">Delete Topic?</h3>
  <p className="mt-2 text-sm text-gray-600">
    This will permanently delete "{topicToDelete?.masterTitle}" and all associated nodes.
  </p>
  <div className="mt-6 flex justify-end gap-3">
    <button 
      onClick={() => setDeleteConfirm(null)}
      className="px-4 py-2 text-sm border border-gray-300"
    >
      Cancel
    </button>
    <button 
      onClick={confirmDelete}
      className="px-4 py-2 text-sm bg-red-600 text-white"
    >
      Delete Permanently
    </button>
  </div>
</Modal>
```

**Step 4: Toast Undo (Alternative to Modal)**
```tsx
// After deletion
toast({
  title: "Topic deleted",
  description: topicTitle,
  action: (
    <button onClick={handleUndo}>Undo</button>
  ),
  duration: 5000
});

// Store deleted topic in state temporarily
const [deletedTopic, setDeletedTopic] = useState<Topic | null>(null);
```

---

## 5. Keyboard Shortcuts (Power User Feature)

**Pattern from Linear/Notion:**
- `Backspace` or `Delete` key when item focused → Opens confirmation
- `Shift + Backspace` → Deletes immediately (power user)

**Implementation:**
```tsx
const handleKeyDown = (e: KeyboardEvent, topicId: string) => {
  if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    if (e.shiftKey) {
      handleDeleteImmediate(topicId);
    } else {
      setDeleteConfirm(topicId);
    }
  }
};
```

---

## 6. Visual Design Tokens (NYT Style)

```typescript
// Tailwind classes for delete UI
const deletePatterns = {
  // Three-dot menu trigger
  menuTrigger: clsx(
    "absolute right-2 top-1/2 -translate-y-1/2",
    "h-8 w-8 flex items-center justify-center",
    "opacity-0 group-hover:opacity-100",
    "transition-opacity duration-150",
    "text-gray-400 hover:text-ink",
    "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
  ),
  
  // Dropdown menu container
  menuContent: clsx(
    "min-w-[180px] border border-gray-200 bg-white shadow-lg",
    "rounded-none", // Sharp edges
    "py-1"
  ),
  
  // Regular menu item
  menuItem: clsx(
    "px-4 py-2 text-sm text-ink",
    "hover:bg-gray-50",
    "cursor-pointer transition-colors"
  ),
  
  // Destructive menu item
  deleteItem: clsx(
    "px-4 py-2 text-sm text-gray-700",
    "hover:bg-red-50 hover:text-red-700",
    "cursor-pointer transition-colors"
  ),
  
  // Divider
  separator: "h-px bg-gray-100 my-1"
};
```

---

## 7. Mobile Adaptations

**For responsive design (< 768px):**

1. **Three-dot menu remains** (don't switch to swipe)
2. **Larger touch target:** 44×44px minimum
3. **Menu positioning:** Always align to right edge (not center)
4. **Confirmation modal:** Full-screen overlay on mobile

```tsx
<DropdownMenuContent 
  align="end"
  className={clsx(
    "min-w-[180px]",
    "md:min-w-[180px]", // Desktop
    "max-md:min-w-[200px] max-md:text-base" // Mobile: larger text
  )}
>
```

---

## 8. Analytics Considerations

**Track these events:**
- `topic_menu_opened` - How often users access the menu
- `topic_delete_initiated` - User clicked delete
- `topic_delete_confirmed` - User confirmed in modal
- `topic_delete_cancelled` - User cancelled
- `topic_delete_undone` - User clicked undo in toast

**Why:** Helps understand if users find the pattern or struggle with discoverability

---

## Summary Table

| Pattern | Clean UI | Accessible | Mobile | NYT Fit | Recommendation |
|---------|----------|------------|--------|---------|----------------|
| Hover-Reveal Icon | ✅ | ⚠️ | ❌ | ⚠️ | Secondary option |
| Three-Dot Menu | ✅ | ✅ | ✅ | ✅ | **Primary (Recommended)** |
| Swipe Actions | ✅ | ❌ | ✅ | ❌ | Skip |
| Context Menu | ✅ | ⚠️ | ❌ | ✅ | Good addition |
| Inline Persistent | ❌ | ✅ | ✅ | ❌ | Avoid |

**Final Recommendation:**  
**Three-Dot Overflow Menu** (hover-reveal) + **Context Menu** (right-click) + **Confirmation Modal** + **Keyboard Shortcut** (`Backspace` when focused)

This combination provides:
- Clean aesthetic (NYT standard)
- Multiple access methods (mouse, keyboard, touch)
- Safety (confirmation prevents accidents)
- Scalability (easy to add more actions)

