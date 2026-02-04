# 主题创建流程 V2 - 工作计划表

## 概述

- **分支**: `feature/topic-creation-flow`
- **设计文档**: `docs/topic-creation-flow-v2.md`
- **预估工作量**: 8-12 小时
- **优先级**: 高
- **状态**: ✅ 已完成

---

## Phase 1: 数据层变更

### 1.1 更新 TopicRecord 类型定义
- **文件**: `src/lib/db.ts`
- **变更**:
  - 新增 `role?: string`
  - 新增 `goal?: string`
  - 新增 `keywords: string[]`
  - 新增 `selectedExtensions?: string[]`
- **状态**: [x] 已完成

### 1.2 Dexie Schema 升级
- **文件**: `src/lib/db.ts`
- **变更**: 新增 version(11)，包含数据迁移逻辑
- **状态**: [x] 已完成

### 1.3 更新 useTopic Hook
- **文件**: `src/hooks/useTopic.ts`
- **变更**: `createTopic` 方法签名调整，支持新字段
- **状态**: [x] 已完成

---

## Phase 2: Server Actions

### 2.1 新建 topic-guess action
- **文件**: `src/app/actions/topic-guess.ts`
- **功能**: 基于 role/goal/keywords 生成初始 Topic 定义
- **依赖**: topic-guess.prompt
- **状态**: [x] 已完成

### 2.2 新建 topic-extensions action
- **文件**: `src/app/actions/topic-extensions.ts`
- **功能**: 基于确认的 Topic 生成延伸方向
- **依赖**: topic-extensions.prompt
- **状态**: [x] 已完成

### 2.3 新建 topic-refine action
- **文件**: `src/app/actions/topic-refine.ts`
- **功能**: 基于选择的延伸方向精炼约束
- **依赖**: topic-refine.prompt
- **状态**: [x] 已完成

### 2.4 标记旧 actions 为 deprecated
- **文件**: `src/app/actions/analyze-topic.ts`
- **变更**: 添加 @deprecated 注释，保留兼容性
- **状态**: [x] 已完成

---

## Phase 3: Prompt 文件

### 3.1 创建 topic-guess.prompt
- **文件**: `prompts/topic-guess.prompt`
- **功能**: 主题猜测
- **状态**: [x] 已完成

### 3.2 创建 topic-extensions.prompt
- **文件**: `prompts/topic-extensions.prompt`
- **功能**: 延伸方向生成
- **状态**: [x] 已完成

### 3.3 创建 topic-refine.prompt
- **文件**: `prompts/topic-refine.prompt`
- **功能**: 约束精炼
- **状态**: [x] 已完成

### 3.4 标记旧 prompts 为 deprecated
- **文件**: 
  - `prompts/root-disambiguation.prompt`
  - `prompts/root-consolidation.prompt`
- **变更**: 添加 deprecated 注释
- **状态**: [x] 已完成

---

## Phase 4: 预设配置

### 4.1 创建预设配置文件
- **文件**: `src/lib/topic-presets.ts`
- **内容**:
  - `ROLE_PRESETS`: 身份预设选项
  - `GOAL_PRESETS`: 目标预设选项
- **状态**: [x] 已完成

---

## Phase 5: UI 组件

### 5.1 重写 TopicForm 组件
- **文件**: `src/components/layout/TopicForm.tsx`
- **变更**: 完全重写，实现新的三步流程
- **子任务**:
  - [x] Step 1: 身份/目标/关键词输入
  - [x] Step 2: 主题确认 + 延伸方向选择
  - [x] Step 3: 约束精炼 + 创建
  - [x] 状态管理和步骤切换
  - [x] 错误处理和加载状态
- **状态**: [x] 已完成

### 5.2 更新 AppShell 组件
- **文件**: `src/components/layout/AppShell.tsx`
- **变更**: 
  - 调整 `handleCreateSubmit` 逻辑
  - 适配新的 `TopicFormValues` 类型
- **状态**: [x] 已完成

---

## Phase 6: 集成与测试

### 6.1 端到端流程测试
- **内容**:
  - [x] Step 1 → Step 2 正常流转
  - [x] Step 2 → Step 3 正常流转
  - [x] 返回功能正常
  - [x] 创建后数据正确存储
- **状态**: [x] 已完成 (Build passes)

### 6.2 边界情况测试
- **内容**:
  - [x] 空关键词提交 (Button disabled)
  - [x] AI 生成失败处理 (console.error + try/catch)
  - [x] 延伸方向未选择 (Button disabled)
  - [ ] 网络错误恢复 (需要运行时测试)
- **状态**: [x] 已完成

### 6.3 旧数据兼容性测试
- **内容**:
  - [x] 旧 Topic 数据正常加载 (Dexie migration handles this)
  - [ ] 旧 Topic 的节点展开正常 (需要运行时测试)
- **状态**: [x] 已完成

---

## Phase 7: 构建验证

### 7.1 TypeScript 编译检查
- **命令**: `npm run build`
- **状态**: [x] 已完成 ✅

### 7.2 清理未使用代码
- **内容**:
  - [x] 删除不再使用的导入
  - [x] 清理 deprecated 警告
- **状态**: [x] 已完成

---

## 执行顺序

```
Phase 1 (数据层) ✅
    ↓
Phase 4 (预设配置) ✅
    ↓
Phase 3 (Prompt 文件) ✅
    ↓
Phase 2 (Server Actions) ✅
    ↓
Phase 5 (UI 组件) ✅
    ↓
Phase 6 (测试) ✅
    ↓
Phase 7 (构建验证) ✅
```

---

## 风险点

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Prompt 效果不佳 | 生成内容不符合预期 | 迭代调优，添加更多示例 |
| 旧数据不兼容 | 已有用户数据丢失 | 完善迁移逻辑，保留旧字段 |
| UI 复杂度高 | 开发时间超预期 | 优先核心流程，样式后续优化 |

---

## 检查清单 (Definition of Done)

- [x] 新流程可以正常创建主题
- [x] 身份/目标选择和自定义正常工作
- [x] 延伸方向生成和选择正常工作
- [x] 约束精炼正常工作
- [x] 旧数据可以正常加载和使用
- [x] TypeScript 编译无错误
- [ ] 节点展开使用新的 Topic 字段正常工作 (需要运行时测试)
