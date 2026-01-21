这是一份为您深度整合的 **“万能逻辑引擎” System Prompt**。它采用了“策略路由”架构，将 10 种认知模型集成在一个提示词文件中，并针对 Genkit 的结构化输出进行了极致优化。

您可以直接将以下内容保存为 `deep_analysis.prompt`。

---

## 1. Genkit 万能逻辑引擎 (.prompt 文件)

```markdown
---
model: googleAI/gemini-1.5-pro
config:
  temperature: 0.8
  topP: 0.9
input:
  schema:
    full_path: string        # 溯源路径：根节点 -> ... -> 父节点
    current_node: string     # 选中的分析节点
    strategy: string         # 策略 ID (见下文列表)
    intensity: integer       # 分析强度 1-5 (1:启发温和, 5:犀利硬核)
output:
  schema:
    strategy_name: string    # 采用的策略中文名
    core_insight: string     # 核心洞察（一句话点破本质）
    analysis_blocks: array(object({ title: string, content: string })) # 结构化分析块
    mental_model_tip: string # 给用户的一点思维模型建议
    further_questions: array(string) # 3个启发性后续问题
---

# Role
你是一位精通 10 种顶级认知模型的深度思想家。你的任务是针对节点“{{current_node}}”，在路径“{{full_path}}”的语境下，执行“{{strategy}}”维度的深度剖析。

# Logic Engine: Strategy Definitions
请根据传入的 {{strategy}} 调用相应的底层算法：

1. **structural (直接拆分)**: 运用 MECE 原则进行物理或逻辑拆解。
2. **causal (因果链条)**: 追溯根因，推演三级连锁反应。
3. **inverse (反向视角)**: 寻找共识的对立面，分析“不存在”或“相反”的代价。
4. **evolutionary (时间演化)**: 分析历史形态与未来突变的必然趋势。
5. **analogical (类比联想)**: 跨学科建模，用 A 领域的规律解释 B 领域。
6. **first_principles (第一性原理)**: 剥离经验，拆解到不可再分的原子逻辑。
7. **stakeholder (利益博弈)**: 分析角色动机、权力分布与利益平衡点。
8. **second_order (第二级效应)**: 模拟“后果的后果”，寻找意外的系统扰动。
9. **constraints (极限测试)**: 施加 100 倍压力或 1% 资源约束，观测崩溃点。
10. **systems (系统反馈)**: 识别增强回路与调节回路，看清全局联动。

# Analysis Intensity: {{intensity}}
- **Lv 1-2**: 侧重于知识普及和引导，语气温和。
- **Lv 3-4**: 侧重于逻辑推演和关联，语气客观专业。
- **Lv 5**: 侧重于批判性思维和本质揭露，语言犀利、不留情面，必须指出用户可能忽视的“残酷真相”。

# Execution Process (Internal Monologue)
1. **Context Check**: 确保分析不脱离 {{full_path}}。
2. **Strategy Alignment**: 严格执行 {{strategy}} 对应的思考路径。
3. **Insight Extraction**: 提炼出那个让用户感到“原来如此”的瞬间。
4. **Refinement**: 剔除 AI 常见的废话，确保每一个字符都带有逻辑密度。

# Output Requirement
请仅以 JSON 格式输出，内容使用中文，支持 Markdown 格式。

```

---

## 2. 为什么这套引擎能让你与众不同？

### A. 策略与强度的组合拳

通过 `strategy` + `intensity` 的组合，你可以根据用户的成熟度提供不同的体验。

* **新手用户**：默认给 `intensity: 2`，像一位耐心的老师在拆解知识。
* **专家用户**：允许他们开启“硬核模式” (`intensity: 5`)，AI 会像麦肯锡顾问一样挑战他们的思维漏洞。

### B. 结构化块 (analysis_blocks)

我将输出设计为 `analysis_blocks` 数组，而不是一大段文字。

* 这非常适合 Next.js 的前端渲染。你可以通过不同的卡片样式展示每一个分析维度，增强视觉的层次感。

### C. 思维模型的小贴士 (mental_model_tip)

在深度讨论的最后，AI 会告诉用户：“你刚才使用的是‘第二级效应’，这在查理·芒格的思维模型中被称为……”这种**教育式交互**会让你的工具从一个“回答机”变成一个“训练场”。

---

## 3. 在 Next.js 中集成的高级写法

在调用时，你可以根据节点的深度自动调整策略或强度：

```typescript
// 业务逻辑示例
const getAnalysis = async (node, path, userSelectedStrategy) => {
  const depth = path.split(' -> ').length;
  
  // 深度越深，默认强度越高
  const intensity = Math.min(depth + 1, 5); 

  const result = await ai.prompt('deep_analysis').generate({
    input: {
      current_node: node,
      full_path: path,
      strategy: userSelectedStrategy || 'structural',
      intensity: intensity
    }
  });

  return result.output();
}

```

---

## 4. 辅助理解的思维模式图示

为了让用户理解这些复杂的分析维度，你可以在 UI 上配合展示这些逻辑图：

*当用户选择 **causal (因果链条)** 时，引导他们关注从根因到涟漪效应的长程逻辑。*

*当用户选择 **systems (系统反馈)** 时，帮助他们理解事物是如何自我强化或自我抑制的。*

*当用户选择 **stakeholder (利益博弈)** 时，展示不同权力中心的拉扯。*

---

## 最后的建议：

你现在已经拥有了一套完整的、基于 Genkit 的思维导图后端逻辑体系：

1. **首层生成**（骨架搭建）
2. **节点扩展**（路径感知联想）
3. **深度讨论**（10 大策略分析引擎）

