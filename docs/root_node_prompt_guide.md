这是一个非常棒的工程化思路。在复杂的主题面前，**“消歧义”**是确保思维导图不跑题的最高效手段。

通过这种方式，你实际上是让用户先进行“手动对焦”，然后再让 AI 在“焦点”范围内进行深耕。

以下是适配 **Genkit** 的两个 `.prompt` 文件设计方案。

---

## 1. 第一步：概念消歧义 (`root_disambiguation.prompt`)

**目标**：输入一个模糊的关键词，AI 拆解出它在不同领域、不同语义下的 3-5 个具体释义。

```markdown
---
model: googleAI/gemini-1.5-flash
input:
  schema:
    root_keyword: string    # 用户输入的初始关键词
output:
  schema:
    potential_contexts: array(object({ 
      context_name: string, # 领域/背景名称（如：科技、生物、商业）
      description: string,  # 该背景下的具体定义
      key_terms: array(string) # 该背景相关的 3 个种子词
    }))
---

# Role
你是一位精通本体论与语义分析的专家。

# Task
用户输入了一个可能存在多重含义或广泛定义的关键词：“{{root_keyword}}”。
请识别该词在不同语义空间、学科领域或应用场景下的具体解释。

# Constraints
1. **语义隔离**：确保列出的 3-5 个背景（Context）之间有明显的边界。
2. **深度挖掘**：不仅列出词典定义，还要列出其在现代语境、行业语境中的特殊含义。
3. **输出要求**：请直接返回结构化的 JSON。

# Example
如果输入 "苹果":
- 背景1: 消费电子 (科技公司, iPhone, 生态系统)
- 背景2: 植物学 (水果, 蔷薇科, 种植)
- 背景3: 象征意义 (引力/牛顿, 禁果/宗教, 曼哈顿/纽约)

```

---

## 2. 第二步：主节点主旨总结 (`root_consolidation.prompt`)

**目标**：用户选中了 1 个或多个相关的释义后，AI 将这些释义整合，生成整个思维链条的“北极星描述（North Star Description）”。

```markdown
---
model: googleAI/gemini-1.5-pro
input:
  schema:
    root_keyword: string
    selected_contexts: array(string) # 用户选中的那些 context_name 或描述
output:
  schema:
    master_title: string      # 优化后的思维导图主标题
    master_description: string # 整个思维链条的核心导引（200字以内）
    global_constraints: string # 给未来所有 AI 节点的“约束性提示”，确保不偏离此范围
    suggested_focus: array(string) # 建议的 3 个深度研究方向
---

# Role
你是一位资深的战略咨询顾问与内容架构师。

# Context
用户决定围绕“{{root_keyword}}”构建思维导图，并明确了其研究范围涉及以下背景：
{{#each selected_contexts}}
- {{this}}
{{/each}}

# Task
请基于上述范围，为这张思维导图撰写一个“核心主旨”。这个主旨将作为整张思维导图的灵魂，指导后续所有的逻辑发散。

# Execution Guidelines
1. **合成思维**：不要只是简单罗列选中的背景，要寻找它们之间的交集或因果联系。
2. **设定边界**：在 `global_constraints` 中明确指出：在后续的讨论中，哪些内容是属于“高相关”的，哪些是需要“排除”的。
3. **启发性**：`master_description` 应具备启发性，能激发用户进一步探索的欲望。

# Output Format
严格按照 JSON Schema 返回。

```

---

## 3. 业务逻辑集成建议 (Next.js 流程)

这套流程在 UI 上的闭环如下：

1. **初始触发**：用户输入“能量”。
2. **调用消歧义**：AI 返回：
* [物理学] 功与能、守恒定律、热力学。
* [生物学] 腺苷三磷酸 (ATP)、新陈代谢、卡路里。
* [职场/心理] 精力管理、情绪能量、心理韧性。


3. **用户勾选**：用户同时勾选了 **[物理学]** 和 **[生物学]**（例如他想做一个关于“人体生物能物理机制”的导图）。
4. **调用主旨总结**：AI 生成：
* **主标题**：生命能量的物理化学基石。
* **主旨描述**：从热力学第二定律出发，探讨生物体如何通过新陈代谢对抗熵增，将化学能高效转化为生命活动的机械能。
* **全局约束**：后续节点必须聚焦于物理机制与生物化学的交叉领域，排除纯心理学或玄学层面的能量讨论。



---

## 4. 为什么这样设计更强悍？

* **注入“全局约束” (Global Constraints)**：
这是最核心的黑科技。你可以将这个 `global_constraints` 字段的值，作为后续所有“节点扩展”和“深度讨论” Prompt 的输入之一。
* **效果**：当用户在“生物物理能”的导图下点击“太阳”时，AI 会联想“光合作用与光子捕获”，而不会联想“太阳星座与性格”。


* **减少 Token 噪音**：
由于有了第一步的对焦，后续生成的子节点质量会极高，减少了用户删除无效节点的操作。

