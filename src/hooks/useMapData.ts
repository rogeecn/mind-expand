import { useLiveQuery } from "dexie-react-hooks";
import { db, type EdgeRecord, type NodeRecord, type TopicStyle } from "@/lib/db";

export type MapData = {
  nodes: NodeRecord[];
  edges: EdgeRecord[];
};

export function useMapData(topicId: string | null) {
  const nodes = useLiveQuery(async () => {
    if (!topicId) return [];
    return db.nodes.where("topicId").equals(topicId).toArray();
  }, [topicId]);

  const edges = useLiveQuery(async () => {
    if (!topicId) return [];
    return db.edges.where("topicId").equals(topicId).toArray();
  }, [topicId]);

  const addNodes = async (newNodes: NodeRecord[]) => {
    if (!topicId) return;
    await db.nodes.bulkPut(newNodes);
  };

  const addEdges = async (newEdges: EdgeRecord[]) => {
    if (!topicId) return;
    await db.edges.bulkPut(newEdges);
  };

  const updateNodePosition = async (id: string, x: number, y: number) => {
    if (!topicId) return;
    await db.nodes.update(id, { x, y });
  };

  const setNodeStyleForTopic = async (style: TopicStyle["nodeStyle"]) => {
    if (!topicId) return;
    await db.nodes.where("topicId").equals(topicId).modify({ nodeStyle: style });
  };

  const setEdgeStyleForTopic = async (style: TopicStyle["edgeStyle"]) => {
    if (!topicId) return;
    await db.edges.where("topicId").equals(topicId).modify({ edgeStyle: style });
  };

  return {
    nodes: nodes ?? [],
    edges: edges ?? [],
    addNodes,
    addEdges,
    updateNodePosition,
    setNodeStyleForTopic,
    setEdgeStyleForTopic
  };
}
