import { useLiveQuery } from "dexie-react-hooks";
import { db, type TopicRecord, type TopicStyle } from "@/lib/db";
import { createId } from "@/lib/uuid";

const defaultStyle: TopicStyle = {
  edgeStyle: "bezier",
  nodeStyle: "nyt"
};

export function useTopic(topicId: string | null) {
  const topic = useLiveQuery(async () => {
    if (!topicId) return null;
    return db.topics.get(topicId);
  }, [topicId]);

  const createTopic = async (rootKeyword: string) => {
    const now = Date.now();
    const newTopic: TopicRecord = {
      id: createId(),
      rootKeyword,
      styleConfig: defaultStyle,
      createdAt: now,
      updatedAt: now
    };
    await db.topics.put(newTopic);
    return newTopic;
  };

  const updateStyle = async (style: Partial<TopicStyle>) => {
    if (!topicId) return;
    const topicRecord = await db.topics.get(topicId);
    if (!topicRecord) return;
    const updatedStyle = { ...topicRecord.styleConfig, ...style };
    await db.topics.update(topicId, {
      styleConfig: updatedStyle,
      updatedAt: Date.now()
    });
  };

  return { topic, createTopic, updateStyle };
}
