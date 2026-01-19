"use client";

import { AppShell } from "@/components/layout/AppShell";

type TopicPageProps = {
  params: { id: string };
};

export default function TopicPage({ params }: TopicPageProps) {
  return <AppShell mode="view" topicId={params.id} />;
}
