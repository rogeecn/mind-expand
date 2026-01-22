"use client";

import { useMemo, useState } from "react";
import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { Archive, ArrowLeft, UploadCloud } from "lucide-react";
import clsx from "clsx";
import { db } from "@/lib/db";
import { Modal } from "@/components/common/Modal";
import {
  downloadBackup,
  getTopicBackup,
  importExportFile,
  isBackupFile,
  type BackupFile,
  type TopicBackup
} from "@/components/map/ImportExport";

type ImportAction = "import" | "overwrite" | "skip";

type ImportCandidate = {
  backup: TopicBackup;
  exists: boolean;
  action: ImportAction;
};

type TopicManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const actionLabels: Record<ImportAction, string> = {
  import: "导入",
  overwrite: "覆盖",
  skip: "跳过"
};

export function TopicManagerModal({ isOpen, onClose }: TopicManagerModalProps) {
  const topics = useLiveQuery(async () => {
    return db.topics.orderBy("updatedAt").reverse().toArray();
  }, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"export" | "import">("export");
  const [importFile, setImportFile] = useState<BackupFile | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(() => {
    if (!topics?.length) return false;
    return topics.every((topic) => selectedIds.has(topic.id));
  }, [topics, selectedIds]);

  const selectedCount = selectedIds.size;

  const resetImportState = () => {
    setImportFile(null);
    setCandidates([]);
    setMode("export");
    setError(null);
  };

  const handleToggleSelect = (topicId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (!topics?.length) return;
    setSelectedIds((prev) => {
      if (topics.every((topic) => prev.has(topic.id))) {
        return new Set();
      }
      return new Set(topics.map((topic) => topic.id));
    });
  };

  const handleExport = async () => {
    if (!topics?.length || selectedIds.size === 0) return;
    setIsBusy(true);
    try {
      const backups = await Promise.all(
        Array.from(selectedIds).map(async (id) => getTopicBackup(id))
      );
      const data = backups.filter((item): item is TopicBackup => Boolean(item));
      const payload: BackupFile = {
        version: 1,
        timestamp: Date.now(),
        data
      };
      downloadBackup(payload);
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      setIsBusy(true);
      try {
        const payload = await importExportFile(input.files[0]);
        if (!isBackupFile(payload)) {
          setError("导入文件格式不正确。请使用系统导出的备份文件。");
          setIsBusy(false);
          return;
        }
        const existingIds = new Set((await db.topics.toArray()).map((topic) => topic.id));
        const nextCandidates = payload.data.map((backup) => {
          const exists = existingIds.has(backup.topic.id);
          return {
            backup,
            exists,
            action: exists ? "overwrite" : "import"
          } as ImportCandidate;
        });
        setImportFile(payload);
        setCandidates(nextCandidates);
        setMode("import");
        setError(null);
      } finally {
        setIsBusy(false);
      }
    };
    input.click();
  };

  const handleActionChange = (topicId: string, action: ImportAction) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.backup.topic.id === topicId ? { ...candidate, action } : candidate
      )
    );
  };

  const handleExecuteImport = async () => {
    if (!importFile || candidates.length === 0) return;
    setIsBusy(true);
    try {
      await db.transaction("rw", db.topics, db.nodes, db.edges, db.chatMessages, async () => {
        for (const candidate of candidates) {
          if (candidate.action === "skip") continue;

          const { topic, nodes, edges, chats } = candidate.backup;
          if (candidate.action === "overwrite") {
            await db.topics.delete(topic.id);
            const nodeIds = await db.nodes.where("topicId").equals(topic.id).primaryKeys();
            if (nodeIds.length) {
              await db.nodes.bulkDelete(nodeIds as string[]);
            }
            const edgeIds = await db.edges.where("topicId").equals(topic.id).primaryKeys();
            if (edgeIds.length) {
              await db.edges.bulkDelete(edgeIds as string[]);
            }
            const chatIds = await db.chatMessages
              .where("[topicId+nodeId]")
              .between([topic.id, Dexie.minKey], [topic.id, Dexie.maxKey])
              .primaryKeys();
            if (chatIds.length) {
              await db.chatMessages.bulkDelete(chatIds as string[]);
            }
          }

          await db.topics.put({
            ...topic,
            updatedAt: Date.now()
          });
          if (nodes.length) {
            await db.nodes.bulkPut(nodes);
          }
          if (edges.length) {
            await db.edges.bulkPut(edges);
          }
          if (chats.length) {
            await db.chatMessages.bulkPut(chats);
          }
        }
      });

      setSelectedIds(new Set());
      resetImportState();
      onClose();
    } finally {
      setIsBusy(false);
    }
  };

  const handleClose = () => {
    resetImportState();
    onClose();
  };

  const renderExportList = () => (
    <div>
      <div className="divide-y divide-gray-100">
        {topics?.length ? (
          topics.map((topic) => (
            <label
              key={topic.id}
              className={clsx(
                "flex cursor-pointer items-center gap-3 px-2 py-2 transition",
                selectedIds.has(topic.id) ? "bg-gray-50" : "hover:bg-gray-50"
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 border-gray-300 text-black focus:ring-black"
                checked={selectedIds.has(topic.id)}
                onChange={() => handleToggleSelect(topic.id)}
              />
              <div className="font-serif text-sm font-semibold text-ink">
                {topic.masterTitle || topic.rootKeyword}
              </div>
            </label>
          ))
        ) : (
          <div className="py-8 text-sm text-gray-500">暂无导图。</div>
        )}
      </div>
      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleImportClick}
          className="inline-flex items-center gap-2 rounded-sm border border-gray-300 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-600 transition hover:border-black hover:text-black"
        >
          <UploadCloud className="h-4 w-4" />
          导入备份
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs uppercase tracking-[0.2em] text-gray-500 transition hover:text-black"
          >
            {allSelected ? "清空" : "全选"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={selectedCount === 0 || isBusy}
            className={clsx(
              "inline-flex items-center gap-2 rounded-sm border border-black bg-black px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition",
              selectedCount === 0 || isBusy ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"
            )}
          >
            <Archive className="h-4 w-4" />
            导出 {selectedCount || ""}
          </button>
        </div>
      </div>
    </div>
  );

  const renderImportList = () => (
    <div>
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetImportState}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400">导入预览</p>
            <h3 className="mt-2 font-serif text-lg font-semibold text-ink">确认导入策略</h3>
          </div>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
          {importFile?.data.length || 0} 项
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {candidates.map((candidate) => (
          <div key={candidate.backup.topic.id} className="flex items-start justify-between gap-6 px-2 py-4">
            <div>
              <div className="font-serif text-base font-semibold text-ink">
                {candidate.backup.topic.masterTitle || candidate.backup.topic.rootKeyword}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {candidate.backup.topic.globalConstraints ||
                  candidate.backup.topic.description ||
                  "No description"}
              </div>
              <div
                className={clsx(
                  "mt-2 text-[11px] uppercase tracking-[0.3em]",
                  candidate.exists ? "text-red-600" : "text-emerald-600"
                )}
              >
                {candidate.exists ? "ID 冲突" : "新导入"}
              </div>
            </div>
            <div className="min-w-[140px]">
              <select
                value={candidate.action}
                onChange={(event) => handleActionChange(candidate.backup.topic.id, event.target.value as ImportAction)}
                className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-gray-600 focus:border-black focus:outline-none"
              >
                {candidate.exists ? (
                  <>
                    <option value="overwrite">覆盖</option>
                    <option value="skip">跳过</option>
                  </>
                ) : (
                  <>
                    <option value="import">导入</option>
                    <option value="skip">跳过</option>
                  </>
                )}
              </select>
              <div className="mt-2 text-[11px] text-gray-400">{actionLabels[candidate.action]}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={resetImportState}
          className="inline-flex items-center gap-2 rounded-sm border border-gray-300 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-600 transition hover:border-black hover:text-black"
        >
          返回
        </button>
        <button
          type="button"
          onClick={handleExecuteImport}
          disabled={isBusy}
          className={clsx(
            "inline-flex items-center gap-2 rounded-sm border border-black bg-black px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition",
            isBusy ? "cursor-not-allowed opacity-50" : "hover:bg-gray-900"
          )}
        >
          执行导入
        </button>
      </div>
    </div>
  );

  return (
    <Modal title="备份管理" isOpen={isOpen} onClose={handleClose} maxWidth="max-w-4xl">
      {mode === "export" ? renderExportList() : renderImportList()}
    </Modal>
  );
}
