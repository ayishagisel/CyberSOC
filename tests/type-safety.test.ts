// Type Safety Tests
// These tests help catch type mismatches before they become runtime errors

import { z } from 'zod';

// Import shared schemas for validation
// Note: In a real test setup, you'd import these from shared/schema.ts
const workflowSessionSchema = z.object({
  id: z.string(),
  alert_id: z.string(),
  current_node: z.string(),
  started_at: z.string(),
  completed_nodes: z.array(z.string()),
  actions_taken: z.array(z.object({
    timestamp: z.string(),
    action: z.string(),
    details: z.record(z.any()),
  })),
  status: z.enum(["Active", "Completed", "Paused"]),
  user_role: z.enum(["Analyst", "Manager", "Client"]),
});

// Test 1: WorkflowSession Type Validation
// This prevents the error in client/src/hooks/use-workflow.tsx:73
export function validateWorkflowSessionResponse(response: unknown): boolean {
  try {
    workflowSessionSchema.parse(response);
    return true;
  } catch (error) {
    console.error('WorkflowSession validation failed:', error);
    return false;
  }
}

// Test 2: Object Index Signature Validation
// This prevents errors in client/src/pages/dashboard.tsx:96,98
export function validatePlaybookNodeAccess(playbook: unknown, nodeId: string): boolean {
  if (!playbook || typeof playbook !== 'object') {
    console.error('Invalid playbook object');
    return false;
  }

  const typedPlaybook = playbook as { nodes?: Record<string, unknown> };

  if (!typedPlaybook.nodes || typeof typedPlaybook.nodes !== 'object') {
    console.error('Playbook missing nodes property');
    return false;
  }

  if (!(nodeId in typedPlaybook.nodes)) {
    console.error(`Node ${nodeId} not found in playbook`);
    return false;
  }

  return true;
}

// Test 3: Database Query Result Validation
// This prevents errors in server/storage.ts:311
export function validateLogQueryFilters(filters: unknown): boolean {
  const filterSchema = z.object({
    severity: z.string().optional(),
    event_type: z.string().optional(),
    limit: z.number().optional(),
  }).optional();

  try {
    filterSchema.parse(filters);
    return true;
  } catch (error) {
    console.error('Log query filters validation failed:', error);
    return false;
  }
}

// Test 4: API Response Type Guards
export function isValidWorkflowSession(data: unknown): data is {
  id: string;
  alert_id: string;
  current_node: string;
  started_at: string;
  completed_nodes: string[];
  actions_taken: unknown;
  status: "Active" | "Completed" | "Paused";
  user_role: "Analyst" | "Manager" | "Client";
} {
  return workflowSessionSchema.safeParse(data).success;
}

// Test 5: Date/String Conversion Helpers
// These prevent Date being passed where string is expected
export function ensureStringDate(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
}

export function ensureDateObject(dateInput: Date | string): Date {
  if (typeof dateInput === 'string') {
    return new Date(dateInput);
  }
  return dateInput;
}

// Manual test runner (since no test framework is configured)
export function runTypeSafetyTests(): void {
  console.log('Running Type Safety Tests...');

  // Test valid workflow session
  const validSession = {
    id: "test-123",
    alert_id: "alert-456",
    current_node: "initial",
    started_at: "2025-09-20T10:00:00Z",
    completed_nodes: ["node1"],
    actions_taken: [],
    status: "Active" as const,
    user_role: "Analyst" as const
  };

  console.log('✓ Valid WorkflowSession:', validateWorkflowSessionResponse(validSession));

  // Test invalid workflow session (missing properties)
  const invalidSession = {
    id: "test-123",
    alert_id: "alert-456",
    current_node: "initial"
    // Missing required properties
  };

  console.log('✗ Invalid WorkflowSession:', validateWorkflowSessionResponse(invalidSession));

  // Test playbook node access
  const validPlaybook = {
    nodes: {
      "initial": { name: "Initial Response" },
      "investigation": { name: "Investigation" }
    }
  };

  console.log('✓ Valid playbook node access:', validatePlaybookNodeAccess(validPlaybook, "initial"));
  console.log('✗ Invalid playbook node access:', validatePlaybookNodeAccess(validPlaybook, "nonexistent"));

  // Test date conversion
  const dateObj = new Date();
  const dateStr = "2025-09-20T10:00:00Z";

  console.log('✓ Date to string conversion:', ensureStringDate(dateObj));
  console.log('✓ String passthrough:', ensureStringDate(dateStr));

  console.log('Type Safety Tests Complete!');
}

// Export all test functions for use in other modules
export const typeSafetyTests = {
  validateWorkflowSessionResponse,
  validatePlaybookNodeAccess,
  validateLogQueryFilters,
  isValidWorkflowSession,
  ensureStringDate,
  ensureDateObject,
  runTypeSafetyTests
};