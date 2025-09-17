export interface WorkflowStep {
  id: string;
  phase: "Detection" | "Scoping" | "Investigation" | "Remediation" | "Post-Incident";
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "skipped";
}

export interface SessionMetrics {
  startTime: string;
  elapsedTime: string;
  actionsTaken: number;
  totalActions: number;
  completionPercentage: number;
}

export interface MitreAttackInfo {
  techniqueId: string;
  tacticName: string;
  techniqueName: string;
  description: string;
  status: "Active" | "Detected" | "Mitigated" | "Monitored";
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}
