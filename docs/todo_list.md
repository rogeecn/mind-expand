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
  - [x] 新增备份管理（侧边栏导入/导出，按 ID 冲突处理）

- [x] **Planned: Node Details Chat (Confirmed)**
  - [x] Dexie 新增 `chat_messages` 表（`topicId + nodeId`, `role`, `content`, `promptType?`, `createdAt`）
  - [x] 新增 Server Action：`expand-chat`
    - 输入：`rootTopic`, `pathContext`, `nodeTitle`, `nodeDescription`, `message?`, `promptType?`
    - 输出：纯文本 `reply`
  - [x] NodeDetailsPanel 改为聊天 UI
    - 预设按钮触发 user 消息（带 `promptType`）
    - 输入框 + 发送按钮
    - 消息列表（user / assistant），AI 回复显示来源标签
  - [x] 聊天记录持久化 & 删除同步 Dexie
  - [x] 上下文注入：root + path + node.title + node.description
  - [x] 消息列表：只追加、不提供清空

- [ ] **Planned: Root Topic Disambiguation & Consolidation**

- [x] **Polish: Node Details Panel**
  - [x] 标题限制 1 行
  - [x] 描述限制 2 行 (hover 展示完整)
  - [x] 聊天框支持全屏切换
  - [ ] 新增 `root-disambiguation` 提示词（多语义拆解）
  - [ ] 新增 `root-consolidation` 提示词（主旨与全局约束）
  - [ ] TopicForm 调整为两步流程
  - [ ] Topic 数据新增 `masterTitle`/`globalConstraints`/`suggestedFocus`
  - [ ] 下游扩展注入 `globalConstraints`
