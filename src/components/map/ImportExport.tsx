"use client";

import type { EdgeRecord, NodeRecord, TopicRecord } from "@/lib/db";

export type ExportPayload = {
  topic: TopicRecord;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
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

export async function importExportFile(file: File) {
  const text = await file.text();
  return JSON.parse(text) as ExportPayload;
}
