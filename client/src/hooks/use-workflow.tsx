import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Playbook, PlaybookNode, WorkflowSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useWorkflow(alertId: string | null) {
  const [currentNodeId, setCurrentNodeId] = useState<string>("");
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowSession | null>(null);

  // Fetch existing workflow session for this alert with auto-creation on 404
  const { data: existingSession, refetch: refetchSession } = useQuery<WorkflowSession | null>({
    queryKey: ["/api/workflow-sessions", alertId],
    queryFn: async (): Promise<WorkflowSession | null> => {
      if (!alertId) return null;
      const response = await fetch(`/api/workflow-sessions/${alertId}`);
      if (!response.ok) {
        // Auto-create workflow session on 404 per Howard University Playbook  
        try {
          console.log('Auto-creating workflow session for alert:', alertId);
          const createResponse = await apiRequest("POST", "/api/workflow-sessions", {
            alert_id: alertId,
            current_node: "identification_phase",
            completed_nodes: [],
            actions_taken: [],
            status: "Active",
            user_role: "Analyst",
            started_at: new Date().toISOString()
          });
          console.log('Auto-created workflow session:', createResponse);
          return createResponse as WorkflowSession;
        } catch (error) {
          console.error('Failed to auto-create workflow session:', error);
          return null;
        }
      }
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
          started_at: new Date().toISOString()
        });
      }
    },
    onSuccess: (session) => {
      if (session && typeof session === 'object' && 'id' in session && 'alert_id' in session && 'current_node' in session) {
        const workflowSession: WorkflowSession = {
          id: String((session as any).id),
          status: ((session as any).status as "Active" | "Completed" | "Paused") || "Active",
          alert_id: String((session as any).alert_id),
          current_node: String((session as any).current_node),
          started_at: new Date((session as any).started_at || new Date()),
          completed_nodes: ((session as any).completed_nodes as string[]) || [],
          actions_taken: (session as any).actions_taken || {},
          user_role: ((session as any).user_role as "Analyst" | "Manager" | "Client") || "Analyst"
        };
        setWorkflow(workflowSession);
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

  const currentNode = (playbookData?.nodes as Record<string, PlaybookNode> | undefined)?.[currentNodeId];

  const advanceWorkflow = (nextNodeId?: string, actionTaken?: string) => {
    if (nextNodeId && (playbookData?.nodes as Record<string, PlaybookNode> | undefined)?.[nextNodeId] && currentNodeId) {
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
    const currentNodeData = (playbookData?.nodes as Record<string, PlaybookNode> | undefined)?.[currentNodeId];
    const option = currentNodeData?.options?.find((opt: any) => opt.action === action);
    if (option?.next_node) {
      advanceWorkflow(option.next_node, action);
    }
  };

  // Compute test-compatible properties
  const currentStep = playbookData && currentNodeId ?
    Object.keys(playbookData.nodes as Record<string, any> || {}).indexOf(currentNodeId) + 1 : 0;
  const totalSteps = playbookData ? Object.keys(playbookData.nodes as Record<string, any> || {}).length : 0;
  const stepHistory = playbookData ?
    Object.keys(playbookData.nodes as Record<string, any> || {}).map((nodeId, index) => ({
      step: index + 1,
      title: (playbookData.nodes as Record<string, any>)[nodeId]?.title || nodeId,
      completed: completedNodes.includes(nodeId),
      timestamp: completedNodes.includes(nodeId) ? new Date().toISOString() : null
    })) : [];

  return {
    // Original API for existing app usage
    currentNode,
    workflow,
    completedNodes,
    advanceWorkflow,
    executeAction,
    playbook: playbookData,
    isLoading,
    isSaving: saveWorkflowMutation.isPending,
    
    // Test-compatible API for WorkflowTracker component
    currentStep,
    totalSteps,
    stepHistory,
    error: null, // TODO: Add error handling
  };
}