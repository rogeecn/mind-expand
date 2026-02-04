# Delete Button Implementation Guide
## Quick Reference for Mind Expand Sidebar

**Based on:** `delete-button-patterns.md` research  
**Target Component:** `TopicSidebar.tsx`

---

## 🎯 Chosen Pattern: Hover-Reveal Three-Dot Menu

### Why This Pattern?
1. ✅ **Clean aesthetic** - No visual clutter in idle state
2. ✅ **NYT-aligned** - Used in their article lists and saved items
3. ✅ **Scalable** - Easy to add "Rename", "Export", "Duplicate" later
4. ✅ **Accessible** - Works with keyboard, mouse, and screen readers
5. ✅ **Safe** - Two-step process prevents accidental deletion

---

## 📐 Visual States

```
STATE 1: IDLE (Default)
┌─────────────────────────────────────────┐
│  ┃  #01 Coffee Origins                  │
│  ┃  Exploration of coffee bean types... │
│  ┃  Feb 4, 1:30 PM                      │
└─────────────────────────────────────────┘
     ↑ 4px active indicator (left edge)

STATE 2: HOVER
┌─────────────────────────────────────────┐
│  ┃  #01 Coffee Origins               ⋮  │ ← Three dots fade in
│  ┃  Exploration of coffee bean types... │
│  ┃  Feb 4, 1:30 PM                      │
└─────────────────────────────────────────┘

STATE 3: MENU OPEN
┌─────────────────────────────────────────┐
│  ┃  #01 Coffee Origins               ⋮  │
│  ┃  Exploration of coffee...  ┌──────────┴──────────┐
│  ┃  Feb 4, 1:30 PM            │ Rename Topic        │
│                               │ Export Backup       │
│                               ├─────────────────────┤
│                               │ Delete              │ ← Red on hover
│                               └─────────────────────┘
└─────────────────────────────────────────┘

STATE 4: CONFIRMATION MODAL
┌─────────────────────────────────────────────────┐
│                                                 │
│        Delete Topic?                            │
│                                                 │
│        This will permanently delete "Coffee     │
│        Origins" and all associated nodes.       │
│                                                 │
│                     [ Cancel ]  [ Delete ]      │
│                                    ↑ Red bg     │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Checklist

### Phase 1: Add Dependencies
```bash
# If not already installed
npm install @radix-ui/react-dropdown-menu
# OR
pnpm add @radix-ui/react-dropdown-menu
```

### Phase 2: Update TopicSidebar.tsx

#### 2.1 Add State Management
```tsx
const [menuOpen, setMenuOpen] = useState<string | null>(null);
const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
```

#### 2.2 Add Delete Handler
```tsx
const handleDeleteTopic = async (topicId: string) => {
  try {
    await db.transaction('rw', db.topics, db.nodes, db.edges, db.chatMessages, async () => {
      // Delete topic
      await db.topics.delete(topicId);
      
      // Delete all nodes
      const nodeIds = await db.nodes.where('topicId').equals(topicId).primaryKeys();
      if (nodeIds.length) await db.nodes.bulkDelete(nodeIds as string[]);
      
      // Delete all edges
      const edgeIds = await db.edges.where('topicId').equals(topicId).primaryKeys();
      if (edgeIds.length) await db.edges.bulkDelete(edgeIds as string[]);
      
      // Delete all chat messages
      const chatIds = await db.chatMessages
        .where('[topicId+nodeId]')
        .between([topicId, Dexie.minKey], [topicId, Dexie.maxKey])
        .primaryKeys();
      if (chatIds.length) await db.chatMessages.bulkDelete(chatIds as string[]);
    });
    
    setDeleteConfirm(null);
    
    // If deleted topic was active, clear selection
    if (activeTopicId === topicId) {
      onSelectTopic(''); // Or navigate to home
    }
  } catch (error) {
    console.error('Failed to delete topic:', error);
    // TODO: Show error toast
  }
};
```

#### 2.3 Modify List Item Button
```tsx
<button
  key={topic.id}
  type="button"
  onClick={() => onSelectTopic(topic.id)}
  className={clsx(
    "group relative w-full border-b border-gray-100 py-5 pl-6 pr-6 text-left transition-colors duration-200",
    isActive ? "bg-white" : "hover:bg-gray-50/50"
  )}
>
  {/* Existing content */}
  
  {/* NEW: Three-dot menu */}
  <DropdownMenu open={menuOpen === topic.id} onOpenChange={(open) => setMenuOpen(open ? topic.id : null)}>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={clsx(
          "absolute right-2 top-1/2 -translate-y-1/2",
          "h-8 w-8 flex items-center justify-center",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
          "transition-opacity duration-150",
          "text-gray-400 hover:text-ink",
          "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        )}
        onClick={(e) => {
          e.stopPropagation();
        }}
        aria-label={`Options for ${topic.masterTitle || topic.rootKeyword}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent 
      align="end" 
      className="min-w-[180px] border border-gray-200 bg-white shadow-lg rounded-none py-1"
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenuItem 
        className="px-4 py-2 text-sm text-ink hover:bg-gray-50 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Implement rename
          console.log('Rename:', topic.id);
        }}
      >
        Rename Topic
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        className="px-4 py-2 text-sm text-ink hover:bg-gray-50 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Implement export
          console.log('Export:', topic.id);
        }}
      >
        Export Backup
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="h-px bg-gray-100 my-1" />
      
      <DropdownMenuItem 
        className="px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirm(topic.id);
          setMenuOpen(null);
        }}
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</button>
```

#### 2.4 Add Confirmation Modal
```tsx
{/* After the main sidebar content */}
{deleteConfirm && (
  <Modal 
    isOpen={true} 
    onClose={() => setDeleteConfirm(null)}
    title="Delete Topic?"
  >
    <p className="mt-2 text-sm text-gray-600">
      This will permanently delete "
      {topics?.find(t => t.id === deleteConfirm)?.masterTitle || 
       topics?.find(t => t.id === deleteConfirm)?.rootKeyword}" 
      and all associated nodes.
    </p>
    <div className="mt-6 flex justify-end gap-3">
      <button 
        onClick={() => setDeleteConfirm(null)}
        className="px-4 py-2 text-sm border border-gray-300 hover:border-ink transition-colors"
      >
        Cancel
      </button>
      <button 
        onClick={() => handleDeleteTopic(deleteConfirm)}
        className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        Delete Permanently
      </button>
    </div>
  </Modal>
)}
```

---

## 🎨 Styling Reference

### Color Tokens
```typescript
const colors = {
  idle: 'text-gray-400',           // Three-dot icon default
  hover: 'text-ink',               // Three-dot icon on hover
  menuItem: 'text-ink',            // Regular menu items
  menuItemHover: 'bg-gray-50',     // Menu item background on hover
  deleteText: 'text-gray-700',     // Delete option default
  deleteHover: 'hover:bg-red-50 hover:text-red-700', // Delete on hover
  deleteBg: 'bg-red-600',          // Delete button in modal
};
```

### Transitions
```typescript
const transitions = {
  fadeIn: 'transition-opacity duration-150',
  menuOpen: 'transition-colors duration-200',
};
```

---

## ♿ Accessibility Checklist

- [ ] **Keyboard Navigation**
  - `Tab` focuses the three-dot button
  - `Enter` or `Space` opens menu
  - Arrow keys navigate menu items
  - `Escape` closes menu

- [ ] **ARIA Labels**
  - Three-dot button: `aria-label="Options for {topic name}"`
  - Menu items: Clear text labels (no icon-only)
  - Modal: Proper heading hierarchy

- [ ] **Focus Management**
  - Focus visible on all interactive elements
  - Focus returns to trigger after menu closes
  - Focus trapped in modal when open

- [ ] **Screen Reader**
  - Menu state announced (open/closed)
  - Delete action clearly described
  - Confirmation result announced

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Three-dot button appears on hover
- [ ] Three-dot button visible when focused (keyboard)
- [ ] Menu opens on click
- [ ] Menu closes when clicking outside
- [ ] Menu closes on Escape key
- [ ] Delete opens confirmation modal
- [ ] Cancel closes modal without deleting
- [ ] Delete button actually deletes topic
- [ ] Active topic cleared if deleted
- [ ] No errors in console

### Edge Cases
- [ ] What happens if topic is deleted while viewing it?
- [ ] What if menu is open and user scrolls?
- [ ] What if user rapidly clicks multiple menu triggers?
- [ ] Mobile: Touch target is 44×44px minimum

---

## 📱 Mobile Considerations

### Touch Target Size
```tsx
// Ensure minimum 44×44px on mobile
className={clsx(
  "h-8 w-8",           // Desktop: 32×32px
  "md:h-8 md:w-8",     // Desktop
  "max-md:h-11 max-md:w-11" // Mobile: 44×44px
)}
```

### Menu Positioning
```tsx
<DropdownMenuContent 
  align="end"
  sideOffset={4}
  className={clsx(
    "min-w-[180px]",
    "max-md:min-w-[200px] max-md:text-base" // Larger on mobile
  )}
>
```

---

## 🚀 Future Enhancements

### Phase 2: Toast Undo
Instead of confirmation modal, use toast with undo:

```tsx
// Store deleted data temporarily
const [recentlyDeleted, setRecentlyDeleted] = useState<{
  topic: Topic;
  nodes: Node[];
  edges: Edge[];
  chats: ChatMessage[];
} | null>(null);

const handleDeleteWithUndo = async (topicId: string) => {
  // Backup data
  const backup = await getTopicBackup(topicId);
  
  // Delete
  await handleDeleteTopic(topicId);
  
  // Store backup
  setRecentlyDeleted(backup);
  
  // Show toast
  toast({
    title: "Topic deleted",
    description: backup.topic.masterTitle,
    action: <button onClick={handleUndo}>Undo</button>,
    duration: 5000,
  });
  
  // Clear backup after timeout
  setTimeout(() => setRecentlyDeleted(null), 5000);
};
```

### Phase 3: Keyboard Shortcuts
```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.key === 'Backspace' || e.key === 'Delete') && focusedTopic) {
    e.preventDefault();
    setDeleteConfirm(focusedTopic);
  }
};
```

### Phase 4: Right-Click Context Menu
Add `<ContextMenu>` wrapper for power users:

```tsx
<ContextMenu>
  <ContextMenuTrigger>
    {/* List item */}
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Rename</ContextMenuItem>
    <ContextMenuItem>Export</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-red-600">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## 📚 Related Files

- **Research:** `docs/delete-button-patterns.md`
- **UI Guidelines:** `docs/ui_design_guidelines.md`
- **Layout Guidelines:** `docs/ui_layout_guidelines.md`
- **Implementation:** `src/components/layout/TopicSidebar.tsx`

---

## 🎯 Success Metrics

After implementation, verify:
1. ✅ No accidental deletions reported
2. ✅ Users can find the delete option within 3 seconds
3. ✅ Keyboard users can delete without mouse
4. ✅ Mobile users can tap accurately (no mis-taps)
5. ✅ Pattern feels "editorial" not "app-like"

