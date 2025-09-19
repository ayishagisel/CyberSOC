import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Playbook, PlaybookNode, WorkflowSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useWorkflow(alertId: string | null) {
  const [currentNodeId, setCurrentNodeId] = useState<string>("");
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowSession | null>(null);

  // Fetch existing workflow session for this alert
  const { data: existingSession } = useQuery<WorkflowSession | null>({
    queryKey: ["/api/workflow-sessions", alertId],
    queryFn: async (): Promise<WorkflowSession | null> => {
      if (!alertId) return null;
      const response = await fetch(`/api/workflow-sessions/${alertId}`);
      if (!response.ok) return null; // No existing session
      return response.json();
    },
    enabled: !!alertId,
  });

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

  // Create or update workflow session mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: { currentNode: string; completedNodes: string[]; action?: string }) => {
      if (!alertId) return;
      
      const sessionData = {
        alert_id: alertId,
        current_node: data.currentNode,
        completed_nodes: data.completedNodes,
        actions_taken: (workflow?.actions_taken as any[]) || [],
        status: "Active" as const,
        user_role: "Analyst" as const
      };
      
      if (data.action) {
        sessionData.actions_taken = [
          ...sessionData.actions_taken,
          {
            timestamp: new Date().toISOString(),
            action: data.action,
            details: { node: data.currentNode }
          }
        ];
      }
      
      if (workflow?.id) {
        // Update existing session
        return await apiRequest("PUT", `/api/workflow-sessions/${workflow.id}`, sessionData);
      } else {
        // Create new session
        return await apiRequest("POST", "/api/workflow-sessions", {
          ...sessionData,
          started_at: new Date()
        });
      }
    },
    onSuccess: (session) => {
      if (session && typeof session === 'object' && 'id' in session) {
        setWorkflow(session as WorkflowSession);
        queryClient.invalidateQueries({ queryKey: ["/api/workflow-sessions", alertId] });
      }
    }
  });

  // Initialize workflow state from existing session or playbook
  useEffect(() => {
    if (existingSession) {
      // Load from existing session
      setCurrentNodeId(existingSession.current_node);
      setCompletedNodes(existingSession.completed_nodes);
      setWorkflow(existingSession);
    } else if (playbookData && playbookData.start_node && !currentNodeId) {
      // Start new workflow from playbook
      setCurrentNodeId(playbookData.start_node);
      setCompletedNodes([]);
    }
  }, [playbookData, existingSession, currentNodeId]);

  const currentNode = playbookData?.nodes?.[currentNodeId] as PlaybookNode | undefined;

  const advanceWorkflow = (nextNodeId?: string, actionTaken?: string) => {
    if (nextNodeId && playbookData?.nodes?.[nextNodeId] && currentNodeId) {
      // Only add current node to completed if it's not already there and not empty
      const newCompletedNodes = completedNodes.includes(currentNodeId) 
        ? completedNodes 
        : [...completedNodes, currentNodeId];
      
      setCompletedNodes(newCompletedNodes);
      setCurrentNodeId(nextNodeId);
      
      // Save to database
      saveWorkflowMutation.mutate({
        currentNode: nextNodeId,
        completedNodes: newCompletedNodes,
        action: actionTaken
      });
    }
  };

  const executeAction = (action: string) => {
    // Handle workflow actions here
    console.log("Executing action:", action);
    
    // Find the next node based on the action
    const currentNodeData = playbookData?.nodes?.[currentNodeId] as PlaybookNode | undefined;
    const option = currentNodeData?.options?.find((opt: any) => opt.action === action);
    if (option?.next_node) {
      advanceWorkflow(option.next_node, action);
    }
  };

  return {
    currentNode,
    workflow,
    completedNodes,
    advanceWorkflow,
    executeAction,
    playbook: playbookData,
    isLoading,
    isSaving: saveWorkflowMutation.isPending
  };
}