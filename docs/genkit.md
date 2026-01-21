在 Genkit 中，使用 `.prompt` 文件（也称为 Dotprompt）是管理提示词的最佳实践。它将**模型配置**、**输入/输出 Schema** 和**模板内容**解耦。

---

## 1. Genkit `.prompt` 文件示例

创建一个名为 `node_analysis.prompt` 的文件，存放在 `prompts/` 目录下：

```markdown
---
model: googleAI/gemini-1.5-flash
config:
  temperature: 0.7
  topP: 0.95
input:
  schema:
    current_node: string
    full_path: string
    strategy: string
output:
  schema:
    insight: string
    content: string
---

# 角色
你是一位精通 {{strategy}} 维度的深度思考者。

# 任务
请分析位于路径 [{{full_path}}] 下的节点 "{{current_node}}"。

# 执行指令
请严格按照 {{strategy}} 的逻辑框架进行深度拆解，提供具有破坏性的洞察。

# 输出要求
请直接返回 JSON 格式结果。

```

---

## 2. 核心疑问：模型指定了就无法切换吗？

**答案是：完全可以切换。**

`.prompt` 文件中指定的 `model` 只是一个**默认配置（Default）**。在业务代码中调用该提示词时，你可以动态覆盖它。这在需要针对不同用户、不同成本预算或不同复杂度的请求切换模型时非常有用。

### 业务代码中切换模型的两种方式

#### 方式 A：在 `prompt` 引用时覆盖

当你加载并执行提示词时，可以直接传入一个新的 `model` 实例：

```typescript
import { prompt } from '@genkit-ai/dotprompt';
import { googleAI, gemini15Pro } from '@genkit-ai/googleai';

// 1. 获取提示词引用
const analysisPrompt = prompt('node_analysis');

// 2. 在执行时覆盖模型（例如：业务逻辑判断需要使用更强大的 Pro 模型）
const result = await analysisPrompt.generate({
  model: gemini15Pro, // 👈 这里的配置会直接覆盖 .prompt 文件中的 gemini-1.5-flash
  input: {
    current_node: "第一性原理",
    full_path: "思维模型 -> 逻辑工具",
    strategy: "反向视角"
  }
});

console.log(result.output());

```

#### 方式 B：通过 Flow 动态决定

在 Next.js 的服务端逻辑中，你可以根据业务逻辑（如用户级别、节点深度）来决定模型：

```typescript
export const nodeAnalysisFlow = ai.defineFlow(
  { name: 'nodeAnalysisFlow', /* ... */ },
  async (input) => {
    // 业务逻辑：如果节点深度超过3层，使用 Pro 模型，否则使用 Flash
    const modelToUse = input.path.split('->').length > 3 ? gemini15Pro : gemini15Flash;

    return await ai.prompt('node_analysis').generate({
      model: modelToUse, // 👈 动态切换
      input: input,
    });
  }
);

```

---

## 3. 为什么建议在 `.prompt` 里写默认模型？

虽然可以被覆盖，但在文件中指定默认模型仍有三大好处：

1. **独立测试**：你可以在 Genkit Developer UI (GUI) 中直接运行这个 `.prompt` 文件进行调试，无需编写任何 TypeScript 代码。
2. **基准参考**：它定义了该提示词在设计时是基于哪个模型的能力进行优化的（例如：某些提示词依赖 Pro 模型的复杂逻辑推理）。
3. **降级方案**：如果代码中没有显式传入模型，系统会自动回退到这个默认值，保证程序不会报错。

---

## 总结

| 特性 | 说明 |
| --- | --- |
| **.prompt 文件** | 定义默认模型、输入输出结构和模板。 |
| **业务切换** | 完全支持。通过 `generate({ model: ... })` 动态覆盖。 |
| **灵活性** | 极高。你可以一套提示词模板，根据流量或成本在 Flash 和 Pro 之间无缝切换。 |


