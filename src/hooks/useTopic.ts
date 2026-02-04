import { useLiveQuery } from "dexie-react-hooks";
import { db, type TopicRecord, type TopicStyle } from "@/lib/db";
import { createId } from "@/lib/uuid";

const defaultStyle: TopicStyle = {
  edgeStyle: "bezier",
  nodeStyle: "nyt"
};

export type CreateTopicInput = {
  keywords: string[];
  role?: string;
  goal?: string;
  masterTitle?: string;
  description: string;
  globalConstraints?: string;
  suggestedFocus?: string[];
  selectedExtensions?: string[];
};

export function useTopic(topicId: string | null) {
  const topic = useLiveQuery(async () => {
    if (!topicId) return null;
    return db.topics.get(topicId);
  }, [topicId]);

  const createTopic = async (input: CreateTopicInput) => {
    const now = Date.now();
    const newTopic: TopicRecord = {
      id: createId(),
      role: input.role,
      goal: input.goal,
      keywords: input.keywords,
      selectedExtensions: input.selectedExtensions ?? [],
      rootKeyword: input.keywords.join(", "),
      masterTitle: input.masterTitle,
      description: input.description,
      globalConstraints: input.globalConstraints,
      suggestedFocus: input.suggestedFocus,
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

  const updateDescription = async (description: string) => {
    if (!topicId) return;
    await db.topics.update(topicId, { description, updatedAt: Date.now() });
  };

  return { topic, createTopic, updateStyle, updateDescription };
}
