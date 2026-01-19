"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"create" | "view">("view");
  const [topicId, setTopicId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("activeTopicId");
    if (stored) {
      setTopicId(stored);
      setMode("view");
    } else {
      setMode("create");
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return <AppShell mode={mode} topicId={topicId} />;
}
