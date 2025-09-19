import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkflowTrackerProps {
  currentPhase: string;
  completedPhases: string[];
  mitreAttackTechniques: string[];
  onPhaseClick?: (phaseId: string) => void;
}

const WORKFLOW_PHASES = [
  { id: "Detection", name: "Detection", description: "Ransomware detected on 5 endpoints" },
  { id: "Scoping", name: "Scoping", description: "Determine impact and scope" },
  { id: "Investigation", name: "Investigation", description: "Analyze attack vectors" },
  { id: "Remediation", name: "Remediation", description: "Contain and eradicate threat" },
  { id: "Post-Incident", name: "Post-Incident", description: "Document and improve" }
];

const MITRE_TECHNIQUES = [
  { id: "T1486", name: "Data Encrypted for Impact", status: "Active" as const },
  { id: "T1059.001", name: "PowerShell Execution", status: "Detected" as const }
];

export default function WorkflowTracker({ 
  currentPhase, 
  completedPhases,
  mitreAttackTechniques,
  onPhaseClick
}: WorkflowTrackerProps) {
  const getPhaseStatus = (phase: string) => {
    if (completedPhases.includes(phase)) return "completed";
    if (phase === currentPhase) return "active";
    return "pending";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4" />;
      case "active":
        return <Circle className="w-4 h-4 fill-current" />;
      default:
        return <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>;
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Incident Response Workflow</h2>
      
      <div className="space-y-3">
        {WORKFLOW_PHASES.map((phase) => {
          const status = getPhaseStatus(phase.id);
          return (
            <div
              key={phase.id}
              onClick={() => onPhaseClick?.(phase.id)}
              className={`workflow-step ${status} p-3 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                status === "active" ? "border-primary" : "border-muted"
              }`}
              data-testid={`workflow-phase-${phase.id.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{phase.name}</span>
                {getStatusIcon(status)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8">
        <h3 className="text-md font-semibold mb-3">MITRE ATT&CK Techniques</h3>
        <div className="space-y-2">
          {MITRE_TECHNIQUES.map((technique) => (
            <div
              key={technique.id}
              className={`${
                technique.status === "Active" 
                  ? "bg-destructive/10 border-destructive/20" 
                  : "bg-warning/10 border-warning/20"
              } border rounded-lg p-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{technique.id}</span>
                <Badge 
                  variant={technique.status === "Active" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {technique.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{technique.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
