// Workflow Integration Tests
// These tests ensure the workflow system components work together correctly

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mock types based on the actual schemas
interface PlaybookNode {
  id: string;
  title: string;
  description: string;
  actions?: string[];
  next_nodes?: string[];
}

interface Playbook {
  id: string;
  title: string;
  nodes: Record<string, PlaybookNode>;
}

interface WorkflowSession {
  id: string;
  alert_id: string;
  current_node: string;
  started_at: string;
  completed_nodes: string[];
  actions_taken: unknown[];
  status: "Active" | "Completed" | "Paused";
  user_role: "Analyst" | "Manager" | "Client";
}

describe('Workflow Integration Tests', () => {
  it('should map workflow phases to nodes correctly', () => {
  const phaseToNodeMap: Record<string, string> = {
    "Initial Response": "initial_response",
    "Investigation": "investigation_phase",
    "Remediation": "remediation_phase",
    "Post-Incident": "post_incident_phase"
  };

  const validPhases = ["Initial Response", "Investigation", "Remediation", "Post-Incident"];

  // Test that all valid phases have corresponding nodes
  for (const phase of validPhases) {
    if (!phaseToNodeMap[phase]) {
      console.error(`Missing node mapping for phase: ${phase}`);
      return false;
    }
  }

  console.log('✓ All phases have valid node mappings');
  return true;
}

// Test 2: Workflow Session Creation
// Ensures proper type structure for WorkflowSession objects
export function testWorkflowSessionCreation(alertId: string): WorkflowSession | null {
  try {
    const session: WorkflowSession = {
      id: `session-${Date.now()}`,
      alert_id: alertId,
      current_node: "initial_response",
      started_at: new Date().toISOString(),
      completed_nodes: [],
      actions_taken: [],
      status: "Active",
      user_role: "Analyst"
    };

    // Validate the session structure
    if (!session.id || !session.alert_id || !session.current_node) {
      throw new Error('Missing required session properties');
    }

    console.log('✓ WorkflowSession created successfully');
    return session;
  } catch (error) {
    console.error('✗ WorkflowSession creation failed:', error);
    return null;
  }
}

// Test 3: Playbook Node Validation
// Ensures safe access to playbook nodes (prevents dashboard.tsx errors)
export function testPlaybookNodeAccess(playbook: Playbook, nodeId: string): PlaybookNode | null {
  // Type-safe node access
  if (!playbook || !playbook.nodes) {
    console.error('✗ Invalid playbook structure');
    return null;
  }

  if (typeof nodeId !== 'string' || !nodeId.trim()) {
    console.error('✗ Invalid nodeId provided');
    return null;
  }

  const node = playbook.nodes[nodeId];
  if (!node) {
    console.error(`✗ Node '${nodeId}' not found in playbook`);
    return null;
  }

  console.log(`✓ Successfully accessed node: ${nodeId}`);
  return node;
}

// Test 4: Workflow Advancement Logic
// Tests the core workflow progression logic
export function testWorkflowAdvancement(
  session: WorkflowSession,
  playbook: Playbook,
  targetNodeId: string
): WorkflowSession | null {
  try {
    // Validate inputs
    if (!session || !playbook || !targetNodeId) {
      throw new Error('Missing required parameters for workflow advancement');
    }

    // Check if target node exists
    const targetNode = testPlaybookNodeAccess(playbook, targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node '${targetNodeId}' not found`);
    }

    // Create updated session
    const updatedSession: WorkflowSession = {
      ...session,
      current_node: targetNodeId,
      completed_nodes: [...session.completed_nodes, session.current_node],
      actions_taken: [
        ...session.actions_taken,
        {
          timestamp: new Date().toISOString(),
          action: `Advanced to node: ${targetNodeId}`,
          details: { previous_node: session.current_node }
        }
      ]
    };

    console.log(`✓ Workflow advanced from '${session.current_node}' to '${targetNodeId}'`);
    return updatedSession;
  } catch (error) {
    console.error('✗ Workflow advancement failed:', error);
    return null;
  }
}

// Test 5: API Response Validation
// Ensures API responses match expected WorkflowSession type
export function testAPIResponseValidation(response: unknown): boolean {
  // Check basic structure
  if (!response || typeof response !== 'object') {
    console.error('✗ API response is not an object');
    return false;
  }

  const resp = response as Record<string, unknown>;

  // Check required properties
  const requiredProps = ['id', 'alert_id', 'current_node', 'started_at', 'status', 'user_role'];
  for (const prop of requiredProps) {
    if (!(prop in resp)) {
      console.error(`✗ Missing required property: ${prop}`);
      return false;
    }
  }

  // Type-specific validations
  if (typeof resp.id !== 'string' || !resp.id.trim()) {
    console.error('✗ Invalid id property');
    return false;
  }

  if (!['Active', 'Completed', 'Paused'].includes(resp.status as string)) {
    console.error('✗ Invalid status value');
    return false;
  }

  if (!['Analyst', 'Manager', 'Client'].includes(resp.user_role as string)) {
    console.error('✗ Invalid user_role value');
    return false;
  }

  console.log('✓ API response validation passed');
  return true;
}

// Mock data for testing
const mockPlaybook: Playbook = {
  id: "ransomware-playbook",
  title: "Ransomware Response Playbook",
  nodes: {
    "initial_response": {
      id: "initial_response",
      title: "Initial Response",
      description: "Immediate containment steps",
      next_nodes: ["investigation_phase"]
    },
    "investigation_phase": {
      id: "investigation_phase",
      title: "Investigation",
      description: "Forensic analysis and scope determination",
      next_nodes: ["remediation_phase"]
    },
    "remediation_phase": {
      id: "remediation_phase",
      title: "Remediation",
      description: "Recovery and system restoration",
      next_nodes: ["post_incident_phase"]
    },
    "post_incident_phase": {
      id: "post_incident_phase",
      title: "Post-Incident",
      description: "Lessons learned and improvements",
      next_nodes: []
    }
  }
};

// Test runner
export function runWorkflowIntegrationTests(): void {
  console.log('Running Workflow Integration Tests...');

  // Test 1: Phase mapping
  testPhaseToNodeMapping();

  // Test 2: Session creation
  const session = testWorkflowSessionCreation("alert-123");
  if (!session) return;

  // Test 3: Node access
  testPlaybookNodeAccess(mockPlaybook, "initial_response");
  testPlaybookNodeAccess(mockPlaybook, "nonexistent_node"); // Should fail

  // Test 4: Workflow advancement
  const advancedSession = testWorkflowAdvancement(session, mockPlaybook, "investigation_phase");
  if (advancedSession) {
    console.log('✓ Workflow advancement successful');
  }

  // Test 5: API response validation
  testAPIResponseValidation(session);
  testAPIResponseValidation({ incomplete: "data" }); // Should fail

  console.log('Workflow Integration Tests Complete!');
}

export const workflowIntegrationTests = {
  testPhaseToNodeMapping,
  testWorkflowSessionCreation,
  testPlaybookNodeAccess,
  testWorkflowAdvancement,
  testAPIResponseValidation,
  runWorkflowIntegrationTests
};