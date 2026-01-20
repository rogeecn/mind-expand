import Dexie, { type Table } from "dexie";

export type TopicStyle = {
  edgeStyle: "bezier" | "step";
  nodeStyle: "nyt" | "compact";
};

export type TopicRecord = {
  id: string;
  rootKeyword: string;
  description: string;
  styleConfig: TopicStyle;
  createdAt: number;
  updatedAt: number;
};

export type NodeRecord = {
  id: string;
  topicId: string;
  parentId: string | null;
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
  promptType?: "direct" | "cause" | "counter" | "timeline" | "analogy";
  createdAt: number;
};

class MindMapDatabase extends Dexie {
  topics!: Table<TopicRecord, string>;
  nodes!: Table<NodeRecord, string>;
  edges!: Table<EdgeRecord, string>;
  chatMessages!: Table<ChatMessageRecord, string>;

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
  }
}

export const db = new MindMapDatabase();
