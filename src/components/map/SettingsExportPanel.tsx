"use client";

import { TopicManagerPanel } from "@/components/layout/TopicManagerModal";

export function SettingsExportPanel() {
  return (
    <div className="rounded-sm border border-gray-200 bg-white">
      <TopicManagerPanel onClose={() => undefined} embedded />
    </div>
  );
}
