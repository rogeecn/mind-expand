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

- [x] **Planned: Root Topic Disambiguation & Consolidation**

- [x] **Polish: Node Details Panel**
  - [x] 标题限制 1 行
  - [x] 描述限制 2 行 (hover 展示完整)
  - [x] 聊天框支持全屏切换
  - [x] 新增 `root-disambiguation` 提示词（多语义拆解）
  - [x] 新增 `root-consolidation` 提示词（主旨与全局约束）
  - [x] TopicForm 调整为两步流程
  - [x] Topic 数据新增 `masterTitle`/`globalConstraints`/`suggestedFocus`
  - [x] 下游扩展注入 `globalConstraints`

- [x] **Phase 6: Optimization & Polish**
  - [x] **Visual Consistency ("Editorial" Aesthetic)**
    - [x] Refine `TopicSidebar`: Sharp corners (`rounded-sm`), high contrast borders, `Playfair Display` for list items.
    - [x] Refine `NodeDetailsPanel`: Sharp corners, remove excess shadows, match "Newspaper" feel.
    - [x] Refine `NYTNode`: Replace "glowing orange" loading with rotating serif asterisk (*).
  - [x] **Interaction Simplification**
    - [x] `NYTNode`: Visual indicator for "Has Children (Collapsed)" vs "Leaf (Generate AI)".
    - [x] Extract Keyboard Navigation to `useKeyboardNavigation` hook.
  - [x] **Performance Optimization**
    - [x] Optimize `MapCanvas` re-renders (Memoize `visibleNodes` calculation more strictly).
    - [x] Decouple Layout: Prevent "Double Layout" (Action vs Effect).

- [ ] **Planned: User Custom Model & Token Settings (Confirmed)**
  - [ ] Dexie 新增 `settings` 表，存储用户配置（apiToken, modelId）
  - [ ] 创建 `SettingsModal` 组件（Tabs: 模型设置/导出）
  - [ ] 模型设置：实现 Model 选择器 + API Token 输入
  - [ ] 导出功能：导出 JSON 包含 nodes + edges + topics + chatMessages + **settings**
  - [ ] 导入功能：导入 JSON 时恢复 **settings**
  - [ ] MapToolbar 添加设置按钮
  - [ ] expand-node 支持动态模型和 Token
  - [ ] expand-chat 支持动态模型和 Token
