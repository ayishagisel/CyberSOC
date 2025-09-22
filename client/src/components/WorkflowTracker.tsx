import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkflow } from "@/hooks/use-workflow";

interface WorkflowTrackerProps {
  alertId: string;
  userRole: string;
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
  alertId,
  userRole,
  onPhaseClick
}: WorkflowTrackerProps) {
  const { currentStep, totalSteps, stepHistory, isLoading } = useWorkflow(alertId);
  
  const getPhaseStatus = (phase: string) => {
    const completedSteps = stepHistory?.filter(s => s.completed).map(s => s.title) || [];
    if (completedSteps.includes(phase)) return "completed";
    if (stepHistory && stepHistory[currentStep - 1]?.title === phase) return "active";
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

  if (isLoading) {
    return (
      <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Incident Response Progress</h2>
        <div className="text-center text-muted-foreground">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Incident Response Progress</h2>
      {totalSteps > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
      )}
      
      <div className="space-y-3">
        {stepHistory?.map((step, index) => {
          const status = step.completed ? "completed" : (index === currentStep - 1 ? "active" : "pending");
          return (
            <div
              key={step.step}
              onClick={() => onPhaseClick?.(step.title)}
              className={`workflow-step ${status} p-3 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                status === "active" ? "border-primary" : "border-muted"
              }`}
              data-testid={`workflow-phase-${step.title.toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{step.title}</span>
                {getStatusIcon(status)}
              </div>
              {step.timestamp && (
                <p className="text-xs text-muted-foreground mt-1">
                  Completed: {new Date(step.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          );
        }) || WORKFLOW_PHASES.map((phase) => {
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
