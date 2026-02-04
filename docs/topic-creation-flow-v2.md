# 主题创建流程 V2 设计文档

## 1. 问题背景

### 1.1 当前流程的缺陷

```
Step 1: 输入关键词 "AI"
Step 2: 歧义消除 → 返回多个语义背景（多选）
Step 3: 整合选中项 → 生成 master_title, description, constraints
```

**核心问题**：
1. **Step 2 的"歧义消除"导致意图偏离** — 用户被迫在不相关的方向中选择
2. **多选 + 整合 = 二次偏离** — 整合后的主题变成四不像
3. **用户原始意图被 AI 覆盖** — 缺少锚定机制

### 1.2 新流程设计原则

1. **主题在 Step 1 就锚定** — 后续围绕确定的主题展开
2. **Step 2 是"加法"而非"选择题"** — 扩展思维广度，不是让用户选哪个对
3. **Step 3 是"精炼"而非"整合"** — 聚焦，不是拼凑
4. **三元约束贯穿全流程** — 身份(Role) + 目标(Goal) + 关键词(Keywords)

---

## 2. 三元约束模型

```
        ┌─────────────┐
        │   身份      │ ← WHO: 我是谁？决定深度和视角
        │   (Role)    │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │   目标      │ ← WHY: 我要干什么？决定方向和风格
        │   (Goal)    │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │  关键词     │ ← WHAT: 探索什么？决定范围和边界
        │ (Keywords)  │
        └─────────────┘
```

### 2.1 身份预设选项

| ID | 标签 | 描述 | 对生成内容的影响 |
|----|------|------|------------------|
| `student` | 学生 | 正在学习某领域的初学者 | 入门级深度、避免专业术语、循序渐进、多用类比 |
| `researcher` | 研究者 | 学术研究人员或专业从业者 | 专业级深度、直接使用学术术语、关注前沿和方法论 |
| `creator` | 内容创作者 | 媒体作者、博主、自媒体 | 中等深度、可读性优先、关注热点和故事性 |
| `pm` | 产品经理 | 负责产品规划和决策 | 应用级深度、聚焦商业价值和用户场景 |
| `developer` | 开发者 | 软件工程师、技术人员 | 实践级深度、关注实现细节和技术选型 |
| `executive` | 决策者 | 管理层、创业者 | 战略级深度、关注ROI和风险、要点精炼 |
| `custom` | 自定义 | 用户自行描述身份 | 根据描述动态调整 |

### 2.2 目标预设选项

| ID | 标签 | 描述 | 对生成内容的影响 |
|----|------|------|------------------|
| `learn` | 学习新领域 | 系统性了解一个新领域 | 知识结构化、由浅入深、概念清晰 |
| `decide` | 决策分析 | 需要做出某个决定 | 利弊权衡、风险因素、量化指标 |
| `create` | 内容创作 | 为创作收集素材和灵感 | 多角度素材、案例故事、引用来源 |
| `solve` | 问题解决 | 面对具体问题需要解决方案 | 根因分析、方案对比、实施步骤 |
| `brainstorm` | 头脑风暴 | 发散思维、激发创意 | 跨领域联想、非常规视角、不设边界 |
| `review` | 复习总结 | 整理已有知识、查漏补缺 | 框架梳理、重点提炼、关联串联 |
| `custom` | 自定义 | 用户自行描述目标 | 根据描述动态调整 |

---

## 3. 新流程详细设计

### 3.1 Step 1: 输入基础信息

**用户界面**：
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  我是...                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 学生  研究者  创作者  产品经理  开发者  决策者  │   │
│  │ ○ 自定义: [________________]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  我想要...                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 学习新领域  决策分析  内容创作  问题解决       │   │
│  │ 头脑风暴    复习总结                            │   │
│  │ ○ 自定义: [________________]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  关于... (必填)                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 输入关键词，用逗号分隔多个词                    │   │
│  │ 例如: AI, 机器学习, 神经网络                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                        [开始探索]                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**AI Action**: `generateTopicGuess`
- 输入: `{ role?, goal?, keywords: string[] }`
- 输出: `{ title: string, description: string }`
- 失败处理: 如果关键词过于模糊，返回错误提示要求补充

### 3.2 Step 2: 确认主题 + 选择延伸方向

**用户界面**：
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─ 主题定义 ─────────────────────────────────────┐    │
│  │                                                 │    │
│  │  标题: [AI 技术入门学习指南______________]     │    │
│  │                                                 │    │
│  │  描述:                                         │    │
│  │  [系统性了解人工智能的核心概念、发展历程      │    │
│  │   和主要技术分支，建立对 AI 领域的整体认知]   │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  选择你感兴趣的延伸方向 (至少选择 1 个):               │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ ☑ 基础概念     │  │ ☐ 历史与发展   │              │
│  │   核心术语和    │  │   从达特茅斯    │              │
│  │   基本原理      │  │   到深度学习    │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ ☑ 技术分支     │  │ ☐ 应用场景     │              │
│  │   机器学习、    │  │   自动驾驶、    │              │
│  │   深度学习等    │  │   医疗、金融    │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ ☐ 学习路径     │  │ ☐ 工具与框架   │              │
│  │   入门到进阶    │  │   TensorFlow、   │              │
│  │   的推荐路线    │  │   PyTorch 等    │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│                      [生成约束]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**AI Action**: `generateExtensions`
- 输入: `{ role?, goal?, keywords, title, description }`
- 输出: `{ extensions: [{ id, name, description, keyTerms }] }`
- 约束: 返回 4-6 个延伸方向，受 role/goal 影响
- 失败处理: 如果无法生成延伸方向，说明 Step 1 信息不足，提示用户返回修改

### 3.3 Step 3: 精炼约束 + 创建

**用户界面**：
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─ 项目概览 ─────────────────────────────────────┐    │
│  │  AI 技术入门学习指南                           │    │
│  │  身份: 学生 | 目标: 学习新领域                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  核心描述                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [可编辑的精炼后描述...]                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  约束边界                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [可编辑的约束条件...]                          │   │
│  │ 例如: 聚焦入门级内容，避免过深的数学推导；     │   │
│  │ 以概念理解为主，实践操作为辅...                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  建议探索方向                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ • 什么是机器学习、深度学习、神经网络？         │   │
│  │ • AI 的三大学派：符号主义、连接主义、行为主义  │   │
│  │ • 监督学习 vs 无监督学习 vs 强化学习           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                   [创建思维导图]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**AI Action**: `refineConstraints`
- 输入: `{ role?, goal?, keywords, title, description, selectedExtensions }`
- 输出: `{ refinedDescription, constraints, suggestedFocus: string[] }`

---

## 4. 数据模型变更

### 4.1 TopicRecord 新增字段

```typescript
export type TopicRecord = {
  id: string;
  
  // 三元约束
  role?: string;              // 新增: 身份 (预设ID或自定义文本)
  goal?: string;              // 新增: 目标 (预设ID或自定义文本)
  keywords: string[];         // 新增: 关键词数组
  
  // 主题信息 (保留，语义调整)
  rootKeyword: string;        // 保留: 改为 keywords.join(", ") 的冗余存储
  masterTitle?: string;       // 保留: AI 生成的标题
  description: string;        // 保留: 精炼后的核心描述
  globalConstraints?: string; // 保留: 约束边界
  suggestedFocus?: string[];  // 保留: 建议探索方向
  
  // 延伸方向 (新增)
  selectedExtensions?: string[]; // 新增: 用户选择的延伸方向名称
  
  // 元数据 (保留)
  styleConfig: TopicStyle;
  createdAt: number;
  updatedAt: number;
};
```

### 4.2 Dexie Schema 升级

```typescript
this.version(11).stores({
  topics: "id, rootKeyword, updatedAt",
  // ... 其他表不变
}).upgrade((transaction) => {
  return transaction.table("topics").toCollection().modify((topic) => {
    if (!topic.keywords) {
      topic.keywords = topic.rootKeyword ? [topic.rootKeyword] : [];
    }
    if (!topic.selectedExtensions) {
      topic.selectedExtensions = [];
    }
  });
});
```

---

## 5. Prompt 设计

### 5.1 topic-guess.prompt (替代 root-disambiguation)

```yaml
---
model: mind-expand/gpt-4o-mini
input:
  schema:
    role?: string
    role_description?: string
    goal?: string
    goal_description?: string
    keywords: string[]
output:
  schema:
    title: string
    description: string
---

# Role
你是一位精通知识架构的主题规划专家。

# Context
用户想要创建一个思维导图来探索特定主题。

用户信息：
- 身份: {{#if role}}{{role}}{{#if role_description}} ({{role_description}}){{/if}}{{else}}未指定{{/if}}
- 目标: {{#if goal}}{{goal}}{{#if goal_description}} ({{goal_description}}){{/if}}{{else}}未指定{{/if}}
- 关键词: {{#each keywords}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

# Task
基于用户的身份、目标和关键词，推测用户最可能想要探索的主题，生成一个精准的主题定义。

# Constraints
1. title 必须简洁有力，不超过 20 字
2. description 必须在 50-150 字之间，清晰描述主题的核心内容和边界
3. 如果用户指定了身份，description 应该体现该身份视角的关注点
4. 如果用户指定了目标，description 应该围绕该目标组织内容
5. 不要假设用户想要的太宽泛或太狭窄

# Output
仅返回 JSON，包含 title 和 description。
```

### 5.2 topic-extensions.prompt (新增)

```yaml
---
model: mind-expand/gpt-4o-mini
input:
  schema:
    role?: string
    role_description?: string
    goal?: string
    goal_description?: string
    keywords: string[]
    title: string
    description: string
output:
  schema:
    extensions:
      - id: string
        name: string
        description: string
        key_terms: string[]
---

# Role
你是一位思维发散专家，擅长从多个维度扩展主题的探索边界。

# Context
用户已确认要探索的主题：

主题信息：
- 标题: {{title}}
- 描述: {{description}}

用户信息：
- 身份: {{#if role}}{{role}}{{#if role_description}} ({{role_description}}){{/if}}{{else}}未指定{{/if}}
- 目标: {{#if goal}}{{goal}}{{#if goal_description}} ({{goal_description}}){{/if}}{{else}}未指定{{/if}}
- 关键词: {{#each keywords}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

# Task
为该主题生成 4-6 个延伸方向，帮助用户扩展思维广度。

# Strategy by Goal
根据用户目标调整延伸方向的侧重：
- 学习新领域: 基础概念、发展历史、核心技术、应用场景、学习路径
- 决策分析: 利弊分析、风险因素、替代方案、关键指标、案例参考
- 内容创作: 热点话题、争议观点、故事案例、数据素材、引用来源
- 问题解决: 根因分析、解决方案、实施步骤、预防措施、相似案例
- 头脑风暴: 跨领域联想、边缘场景、反向思考、未来趋势、极端假设
- 复习总结: 核心框架、重点概念、常见误区、关联知识、实践检验

# Strategy by Role
根据用户身份调整延伸方向的深度和表达：
- 学生: 侧重基础和入门，避免过于专业的方向
- 研究者: 可以包含前沿和专业方向
- 创作者: 侧重有传播价值的方向
- 产品经理: 侧重商业和用户价值相关方向
- 开发者: 侧重技术实现相关方向
- 决策者: 侧重战略和风险相关方向

# Constraints
1. 每个延伸方向必须与主题高度相关，不能偏离
2. 延伸方向之间应有明确边界，避免重叠
3. name 不超过 8 字
4. description 在 20-50 字之间
5. key_terms 提供 2-4 个关键术语
6. id 使用小写英文 + 下划线，如 basic_concepts

# Output
仅返回 JSON，包含 extensions 数组。
```

### 5.3 topic-refine.prompt (替代 root-consolidation)

```yaml
---
model: mind-expand/gpt-4o-mini
input:
  schema:
    role?: string
    role_description?: string
    goal?: string
    goal_description?: string
    keywords: string[]
    title: string
    description: string
    selected_extensions: string[]
output:
  schema:
    refined_description: string
    constraints: string
    suggested_focus: string[]
---

# Role
你是一位资深的战略咨询顾问与内容架构师。

# Context
用户已确认主题并选择了感兴趣的延伸方向：

主题信息：
- 标题: {{title}}
- 描述: {{description}}
- 选择的延伸方向: {{#each selected_extensions}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

用户信息：
- 身份: {{#if role}}{{role}}{{#if role_description}} ({{role_description}}){{/if}}{{else}}未指定{{/if}}
- 目标: {{#if goal}}{{goal}}{{#if goal_description}} ({{goal_description}}){{/if}}{{else}}未指定{{/if}}
- 关键词: {{#each keywords}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

# Task
基于用户选择的延伸方向，精炼主题定义，生成明确的约束边界和建议探索方向。

# Execution Guidelines
1. refined_description: 在原 description 基础上，融入选择的延伸方向，使其更聚焦
2. constraints: 明确指出
   - 本次探索的边界（包含什么、不包含什么）
   - 深度要求（入门/中级/专业）
   - 如果有身份，体现该身份的关注重点
3. suggested_focus: 生成 3-5 个具体的探索问题或方向
   - 问题应该具体、可回答
   - 覆盖用户选择的延伸方向
   - 符合用户的目标导向

# Output
仅返回 JSON，包含 refined_description, constraints, suggested_focus。
```

---

## 6. 对现有 Prompt 的影响

### 6.1 expand-node.prompt

**影响**: 小

当前使用的输入字段：
- `root_topic` ← 从 `TopicRecord.masterTitle || TopicRecord.rootKeyword` 获取
- `topic_constraints` ← 从 `TopicRecord.globalConstraints` 获取

**变更**: 无需修改 prompt，只需确保调用时传入正确字段。

建议增强（可选）：
- 可以额外传入 `role` 和 `goal`，让节点展开更符合用户身份和目标

### 6.2 expand-concept.prompt

**影响**: 小

同 expand-node.prompt，无需修改。

### 6.3 deep-analysis.prompt

**影响**: 无

该 prompt 用于节点的深度分析聊天，不涉及主题创建流程。

### 6.4 chat-intent.prompt

**影响**: 无

该 prompt 用于聊天意图分析，不涉及主题创建流程。

### 6.5 待删除

- `root-disambiguation.prompt` — 被 `topic-guess.prompt` 替代
- `root-consolidation.prompt` — 被 `topic-refine.prompt` 替代

---

## 7. UI/UX 设计要点

### 7.1 Step 1 设计要点

1. **身份和目标使用标签式选择**，视觉上像 Tag，点击切换选中状态
2. **自定义输入框** 仅在选择"自定义"时展开
3. **关键词输入** 支持逗号分隔，或回车添加标签
4. **按钮状态** 只有关键词非空时才可点击

### 7.2 Step 2 设计要点

1. **主题标题和描述可编辑** — 用户可以修正 AI 的猜测
2. **延伸方向使用卡片网格** — 每个卡片包含名称、描述、关键术语
3. **至少选择 1 个** — 按钮禁用直到有选择
4. **返回按钮** — 可以返回 Step 1 修改输入

### 7.3 Step 3 设计要点

1. **顶部显示项目概览** — 标题 + 身份 + 目标（只读）
2. **三个可编辑区域** — 描述、约束、建议方向
3. **建议方向支持增删** — 用户可以添加自己的方向
4. **创建按钮** — 点击后进入思维导图

---

## 8. 错误处理

### 8.1 Step 1 → Step 2 失败

**场景**: AI 无法基于关键词生成有意义的主题

**处理**:
1. 显示错误提示: "关键词过于模糊，请尝试更具体的描述"
2. 保持在 Step 1，不清空用户输入
3. 可选: 显示 AI 返回的错误原因

### 8.2 Step 2 延伸方向生成失败

**场景**: AI 无法生成延伸方向

**处理**:
1. 显示错误提示: "无法生成延伸方向，请检查主题定义是否足够清晰"
2. 允许用户编辑主题后重试
3. 或返回 Step 1 修改关键词

### 8.3 Step 3 约束生成失败

**场景**: AI 无法生成约束

**处理**:
1. 显示默认约束模板，让用户手动填写
2. 不阻塞创建流程

---

## 9. 迁移策略

### 9.1 数据迁移

旧数据兼容：
- `keywords` 默认从 `rootKeyword` 拆分（按逗号或空格）
- `role` 和 `goal` 默认为 `undefined`
- `selectedExtensions` 默认为空数组

### 9.2 代码迁移

1. 保留旧的 action 文件，标记为 deprecated
2. 新建新的 action 文件
3. TopicForm 完全重写
4. 旧 prompt 文件保留但不再使用，待稳定后删除
