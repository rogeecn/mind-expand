"use client";

import { db, type EdgeRecord, type NodeRecord, type TopicRecord } from "@/lib/db";
import type { ExportPayload } from "@/components/map/ImportExport";

export async function importPayload(payload: ExportPayload) {
  await db.transaction("rw", db.topics, db.nodes, db.edges, async () => {
    await db.topics.put(payload.topic);
    await db.nodes.bulkPut(payload.nodes);
    await db.edges.bulkPut(payload.edges);
  });
}

export function validatePayload(payload: ExportPayload) {
  return Boolean(payload?.topic?.id && Array.isArray(payload.nodes));
}
