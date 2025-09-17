import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Playbook, PlaybookNode, WorkflowSession } from "@shared/schema";

export function useWorkflow(alertId: string | null) {
  const [currentNodeId, setCurrentNodeId] = useState<string>("node_1");
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowSession | null>(null);

  // For demo purposes, we'll use hardcoded playbook data
  const playbookData: Playbook = {
    id: "ransomware-playbook",
    name: "Ransomware Response Playbook",
    description: "Standard response procedure for ransomware incidents",
    start_node: "node_1",
    nodes: {
      "node_1": {
        id: "node_1",
        title: "Initial Detection",
        ai_prompt: "Critical alert indicates ransomware. Do you want to launch the guided response playbook?",
        phase: "Detection",
        options: [
          { label: "Launch Playbook", next_node: "node_2" },
          { label: "Ignore", next_node: "end_ignored" }
        ],
        mitre_techniques: ["T1486"],
        playbook_reference: "Playbook Section 3.1 - Ransomware Response"
      },
      "node_2": {
        id: "node_2",
        title: "Isolate Endpoints",
        ai_prompt: "Playbook 3.1 recommends immediate isolation of affected endpoints. Proceed?",
        phase: "Scoping",
        options: [
          { label: "Isolate All 5 Endpoints", action: "ISOLATE_ALL", next_node: "node_3" },
          { label: "Skip Isolation", next_node: "node_3_skipped" }
        ],
        mitre_techniques: ["T1486", "T1059.001"],
        playbook_reference: "Playbook Section 3.2 - Endpoint Isolation"
      }
    }
  };

  const currentNode = playbookData.nodes[currentNodeId];

  const advanceWorkflow = (nextNodeId?: string) => {
    if (nextNodeId && playbookData.nodes[nextNodeId]) {
      setCompletedNodes(prev => [...prev, currentNodeId]);
      setCurrentNodeId(nextNodeId);
    }
  };

  const executeAction = (action: string) => {
    // Handle workflow actions here
    console.log("Executing action:", action);
    
    // For demo, automatically advance workflow
    const currentNodeData = playbookData.nodes[currentNodeId];
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
    playbook: playbookData
  };
}
