export type PresetOption = {
  id: string;
  label: string;
  description: string;
};

export const ROLE_PRESETS: PresetOption[] = [
  {
    id: "student",
    label: "学生",
    description: "正在学习某领域的初学者"
  },
  {
    id: "researcher",
    label: "研究者",
    description: "学术研究人员或专业从业者"
  },
  {
    id: "creator",
    label: "内容创作者",
    description: "媒体作者、博主、自媒体"
  },
  {
    id: "pm",
    label: "产品经理",
    description: "负责产品规划和决策"
  },
  {
    id: "developer",
    label: "开发者",
    description: "软件工程师、技术人员"
  },
  {
    id: "executive",
    label: "决策者",
    description: "管理层、创业者"
  }
];

export const GOAL_PRESETS: PresetOption[] = [
  {
    id: "learn",
    label: "学习新领域",
    description: "系统性了解一个新领域"
  },
  {
    id: "decide",
    label: "决策分析",
    description: "需要做出某个决定"
  },
  {
    id: "create",
    label: "内容创作",
    description: "为创作收集素材和灵感"
  },
  {
    id: "solve",
    label: "问题解决",
    description: "面对具体问题需要解决方案"
  },
  {
    id: "brainstorm",
    label: "头脑风暴",
    description: "发散思维、激发创意"
  },
  {
    id: "review",
    label: "复习总结",
    description: "整理已有知识、查漏补缺"
  }
];

export function getRoleLabel(roleId: string | undefined): string | undefined {
  if (!roleId) return undefined;
  const preset = ROLE_PRESETS.find((r) => r.id === roleId);
  return preset?.label ?? roleId;
}

export function getGoalLabel(goalId: string | undefined): string | undefined {
  if (!goalId) return undefined;
  const preset = GOAL_PRESETS.find((g) => g.id === goalId);
  return preset?.label ?? goalId;
}
