import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Playbook, PlaybookNode, WorkflowSession } from "@shared/schema";

export function useWorkflow(alertId: string | null) {
  const [currentNodeId, setCurrentNodeId] = useState<string>("");
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowSession | null>(null);

  // Fetch playbook for the specific alert
  const { data: playbookData, isLoading } = useQuery<Playbook | null>({
    queryKey: ["/api/alerts", alertId, "playbook"],
    queryFn: async (): Promise<Playbook | null> => {
      if (!alertId) return null;
      const response = await fetch(`/api/alerts/${alertId}/playbook`);
      if (!response.ok) throw new Error("Failed to fetch playbook");
      return response.json();
    },
    enabled: !!alertId,
  });

  // Initialize currentNodeId when playbook loads
  useEffect(() => {
    if (playbookData && !currentNodeId) {
      setCurrentNodeId(playbookData.start_node);
    }
  }, [playbookData, currentNodeId]);

  const currentNode = playbookData?.nodes[currentNodeId];

  const advanceWorkflow = (nextNodeId?: string) => {
    if (nextNodeId && playbookData?.nodes[nextNodeId]) {
      setCompletedNodes(prev => [...prev, currentNodeId]);
      setCurrentNodeId(nextNodeId);
    }
  };

  const executeAction = (action: string) => {
    // Handle workflow actions here
    console.log("Executing action:", action);
    
    // For demo, automatically advance workflow
    const currentNodeData = playbookData?.nodes[currentNodeId];
    const option = currentNodeData?.options.find(opt => opt.action === action);
    if (option?.next_node) {
      advanceWorkflow(option.next_node);
    }
  };

  return {
    currentNode,
    workflow,
    completedNodes,
    advanceWorkflow,
    executeAction,
    playbook: playbookData,
    isLoading
  };
}
