"use client";

import Dexie from "dexie";
import { db } from "@/lib/db";
import type {
  ChatMessageRecord,
  EdgeRecord,
  NodeRecord,
  SettingsRecord,
  TopicRecord
} from "@/lib/db";

export type ExportPayload = {
  topic: TopicRecord;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
};

export type TopicBackup = {
  topic: TopicRecord;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  chats: ChatMessageRecord[];
};

export type BackupFile = {
  version: 1 | 2;
  timestamp: number;
  data: TopicBackup[];
  settings?: SettingsRecord;
};

export function downloadExport(payload: ExportPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${payload.topic.rootKeyword}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBackup(payload: BackupFile) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mind-expand-backup-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importExportFile(file: File) {
  const text = await file.text();
  return JSON.parse(text) as unknown;
}

export function isBackupFile(payload: unknown): payload is BackupFile {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as BackupFile;
  if (candidate.version !== 2 && candidate.version !== 1) return false;
  if (!Array.isArray(candidate.data)) return false;
  return typeof candidate.timestamp === "number";
}

export async function getTopicBackup(topicId: string): Promise<TopicBackup | null> {
  const topic = await db.topics.get(topicId);
  if (!topic) return null;

  const [nodes, edges, chats] = await Promise.all([
    db.nodes.where("topicId").equals(topicId).toArray(),
    db.edges.where("topicId").equals(topicId).toArray(),
    db.chatMessages
      .where("[topicId+nodeId]")
      .between([topicId, Dexie.minKey], [topicId, Dexie.maxKey])
      .toArray()
  ]);

  return { topic, nodes, edges, chats };
}

export async function getSettingsBackup() {
  return db.settings.get("user-settings");
}
