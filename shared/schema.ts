import { z } from "zod";

// Alert Schema
export const alertSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  status: z.enum(["New", "In Progress", "Resolved", "Dismissed"]),
  timestamp: z.string(),
  affected_endpoints: z.array(z.string()),
  mitre_tactics: z.array(z.string()),
  description: z.string().optional(),
});

export type Alert = z.infer<typeof alertSchema>;

// Endpoint Schema
export const endpointSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  ip_address: z.string(),
  user: z.string(),
  status: z.enum(["Normal", "Affected", "Isolated", "Quarantined"]),
  os: z.string().optional(),
  department: z.string().optional(),
});

export type Endpoint = z.infer<typeof endpointSchema>;

// Log Entry Schema
export const logEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  source: z.string(),
  severity: z.enum(["Critical", "High", "Medium", "Low", "Info"]),
  message: z.string(),
  event_id: z.string().optional(),
  endpoint_id: z.string().optional(),
  raw_data: z.record(z.any()).optional(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

// Playbook Node Schema
export const playbookNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  ai_prompt: z.string(),
  phase: z.enum(["Detection", "Scoping", "Investigation", "Remediation", "Post-Incident"]),
  options: z.array(z.object({
    label: z.string(),
    action: z.string().optional(),
    next_node: z.string().optional(),
  })),
  mitre_techniques: z.array(z.string()).optional(),
  playbook_reference: z.string().optional(),
});

export type PlaybookNode = z.infer<typeof playbookNodeSchema>;

// Playbook Schema
export const playbookSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  start_node: z.string(),
  nodes: z.record(playbookNodeSchema),
});

export type Playbook = z.infer<typeof playbookSchema>;

// MITRE ATT&CK Technique Schema
export const mitreAttackTechniqueSchema = z.object({
  id: z.string(),
  name: z.string(),
  tactic: z.string(),
  description: z.string(),
  status: z.enum(["Active", "Detected", "Mitigated", "Monitored"]),
});

export type MitreAttackTechnique = z.infer<typeof mitreAttackTechniqueSchema>;

// Workflow Session Schema
export const workflowSessionSchema = z.object({
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

export type WorkflowSession = z.infer<typeof workflowSessionSchema>;

// Report Schema
export const reportSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  generated_at: z.string(),
  incident_summary: z.object({
    title: z.string(),
    severity: z.string(),
    affected_assets: z.number(),
    response_time: z.string(),
    status: z.string(),
  }),
  timeline: z.array(z.object({
    timestamp: z.string(),
    phase: z.string(),
    action: z.string(),
    details: z.string(),
  })),
  mitre_techniques: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type Report = z.infer<typeof reportSchema>;
