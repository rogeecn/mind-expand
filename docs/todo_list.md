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

- [ ] **Planned: Node Details Prompt Switcher (Pending Confirmation)**
  - [ ] 新增 Server Action：`expand-concept`
    - 输入：`rootTopic`, `pathContext`, `nodeTitle`, `nodeDescription`, `promptType`
    - 输出：`logic_angle`, `idea`, `insight`
    - 仅生成一条 idea+insight（中/长内容）
  - [ ] NodeDetailsPanel 增加联想按钮组 + 历史列表
    - 按钮组（tab）：直接拆分 / 因果链条 / 反向视角 / 时间演化 / 类比联想
    - 点击按钮触发请求，结果追加到列表底部
    - 每条结果展示 idea 标题 + insight 正文
    - 每条结果支持复制（`idea + insight` 两行）
    - 每条结果支持删除（仅 UI）
  - [ ] 上下文注入：root + path + node.title + node.description
  - [ ] 结果列表：新结果置底、不提供清空全部
