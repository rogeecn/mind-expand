import Dexie, { type Table } from "dexie";

export type TopicStyle = {
  edgeStyle: "bezier" | "step";
  nodeStyle: "nyt" | "compact";
};

export type TopicRecord = {
  id: string;
  role?: string;
  goal?: string;
  keywords: string[];
  selectedExtensions?: string[];
  /** @deprecated Use keywords instead. Kept for backward compatibility. */
  rootKeyword: string;
  masterTitle?: string;
  description: string;
  globalConstraints?: string;
  suggestedFocus?: string[];
  styleConfig: TopicStyle;
  createdAt: number;
  updatedAt: number;
};

export type NodeRecord = {
  id: string;
  topicId: string;
  parentId: string | null;
  order?: number;
  title: string;
  description: string;
  x: number;
  y: number;
  nodeStyle: TopicStyle["nodeStyle"];
  colorTag: "ink" | "amber" | "sky" | "mint" | null;
  collapsed?: boolean;
  createdAt: number;
};

export type EdgeRecord = {
  id: string;
  topicId: string;
  source: string;
  target: string;
  edgeStyle: TopicStyle["edgeStyle"];
  createdAt: number;
};

export type ChatMessageRecord = {
  id: string;
  topicId: string;
  nodeId: string;
  role: "user" | "assistant";
  content: string;
  promptType?:
    | "structural"
    | "causal"
    | "inverse"
    | "evolutionary"
    | "analogical"
    | "first_principles"
    | "stakeholder"
    | "second_order"
    | "constraints"
    | "systems";
  quoteId?: string;
  suggestions?: string[];
  createdAt: number;
};

export type ModelCatalogItem = {
  id: string;
  label: string;
  provider: string;
  model: string;
};

export type SettingsRecord = {
  id: string;
  apiToken?: string;
  modelId?: string;
  baseURL?: string;
  modelCatalog?: ModelCatalogItem[];
  timeoutMs?: number;
  modelPresets?: Array<{
    id: string;
    modelId: string;
    note?: string;
    apiToken?: string;
    baseURL?: string;
    timeoutMs?: number;
  }>;
};

class MindMapDatabase extends Dexie {
  topics!: Table<TopicRecord, string>;
  nodes!: Table<NodeRecord, string>;
  edges!: Table<EdgeRecord, string>;
  chatMessages!: Table<ChatMessageRecord, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("MindExpandDB");
    this.version(1).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source"
    });

    this.version(2).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source"
    }).upgrade((transaction) => {
      return transaction.table("topics").toCollection().modify((topic) => {
        if (!topic.description) {
          topic.description = "";
        }
      });
    });

    this.version(3).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source"
    }).upgrade((transaction) => {
      return transaction.table("nodes").toCollection().modify((node) => {
        if (node.colorTag === undefined) {
          node.colorTag = null;
        }
      });
    });

    this.version(4).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source"
    }).upgrade((transaction) => {
      return transaction.table("nodes").toCollection().modify((node) => {
        if (node.collapsed === undefined) {
          node.collapsed = false;
        }
      });
    });

    this.version(5).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt"
    });

    this.version(6).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt"
    });

    this.version(7).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt",
      settings: "id"
    });

    this.version(8).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt",
      settings: "id"
    });

    this.version(9).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt",
      settings: "id"
    });

    this.version(10).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt",
      settings: "id"
    });

    this.version(11).stores({
      topics: "id, rootKeyword, updatedAt",
      nodes: "id, topicId, parentId",
      edges: "id, topicId, source",
      chatMessages: "id, [topicId+nodeId], createdAt",
      settings: "id"
    }).upgrade((transaction) => {
      return transaction.table("topics").toCollection().modify((topic) => {
        if (!topic.keywords) {
          topic.keywords = topic.rootKeyword 
            ? topic.rootKeyword.split(/[,，\s]+/).map((k: string) => k.trim()).filter(Boolean)
            : [];
        }
        if (!topic.selectedExtensions) {
          topic.selectedExtensions = [];
        }
      });
    });
  }
}

export const db = new MindMapDatabase();
