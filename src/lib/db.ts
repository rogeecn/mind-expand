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

class MindMapDatabase extends Dexie {
  topics!: Table<TopicRecord, string>;
  nodes!: Table<NodeRecord, string>;
  edges!: Table<EdgeRecord, string>;

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
  }
}

export const db = new MindMapDatabase();
