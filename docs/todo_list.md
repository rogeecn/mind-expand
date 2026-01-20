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

- [ ] **Planned: Node Details Chat (Confirmed)**
  - [ ] Dexie 新增 `chat_messages` 表（`topicId + nodeId`, `role`, `content`, `promptType?`, `createdAt`）
  - [ ] 新增 Server Action：`expand-chat`
    - 输入：`rootTopic`, `pathContext`, `nodeTitle`, `nodeDescription`, `message?`, `promptType?`
    - 输出：纯文本 `reply`
  - [ ] NodeDetailsPanel 改为聊天 UI
    - 预设按钮触发 user 消息（带 `promptType`）
    - 输入框 + 发送按钮
    - 消息列表（user / assistant），AI 回复显示来源标签
  - [ ] 聊天记录持久化 & 删除同步 Dexie
  - [ ] 上下文注入：root + path + node.title + node.description
  - [ ] 消息列表：只追加、不提供清空
