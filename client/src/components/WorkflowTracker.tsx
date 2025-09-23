import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkflow } from "@/hooks/use-workflow";

interface WorkflowTrackerProps {
  alertId: string;
  userRole: string;
  onPhaseClick?: (phaseId: string) => void;
}

const WORKFLOW_PHASES = [
  { id: "Preparation", name: "Preparation", description: "Azure Sentinel, Defender XDR, training protocols" },
  { id: "Identification", name: "Identification", description: "SOC triage with AI guidance - anomaly detected" },
  { id: "Containment", name: "Containment", description: "Endpoint isolation, network segmentation, Azure AD lockdown" },
  { id: "Eradication", name: "Eradication", description: "Root cause analysis and Defender cleansing scripts" },
  { id: "Recovery", name: "Recovery", description: "Restore from Azure BCDR, MFA resets, hardened baselines" },
  { id: "Lessons Learned", name: "Lessons Learned", description: "AI-generated timeline and post-mortem analysis" }
];

// Howard University Playbook - Enhanced MITRE ATT&CK integration
const MITRE_TECHNIQUES = [
  { 
    id: "T1486", 
    name: "Data Encrypted for Impact", 
    status: "Active" as const,
    tactic: "TA0040", 
    tacticName: "Impact",
    description: "Ransomware encrypting files across Finance department",
    whyItMatters: "Primary attack vector - immediate containment prevents data loss",
    howardContext: "Similar to 2021 incident - priority: isolate affected endpoints"
  },
  { 
    id: "T1059.001", 
    name: "PowerShell Execution", 
    status: "Detected" as const,
    tactic: "TA0002",
    tacticName: "Execution", 
    description: "Malicious PowerShell scripts detected on multiple endpoints",
    whyItMatters: "Common initial access method - indicates potential living-off-the-land attack",
    howardContext: "Azure Sentinel rule triggered - Defender for Endpoint confirms"
  },
  {
    id: "T1078",
    name: "Valid Accounts", 
    status: "Investigating" as const,
    tactic: "TA0001",
    tacticName: "Initial Access",
    description: "Potential compromised user credentials detected",
    whyItMatters: "Could be initial breach vector - requires immediate account lockdown",
    howardContext: "Azure AD logs show anomalous login patterns"
  },
  {
    id: "T1021",
    name: "Remote Services", 
    status: "Monitoring" as const,
    tactic: "TA0008", 
    tacticName: "Lateral Movement",
    description: "Suspicious RDP/SSH activity between endpoints",
    whyItMatters: "Indicates lateral movement attempt - network segmentation critical",
    howardContext: "NSG rules can prevent further spread"
  }
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

  // Role-based content
  const getRoleBasedContent = () => {
    switch (userRole) {
      case 'Analyst':
        return 'Technical analysis and detailed investigation required for each step.';
      case 'Manager':
        return 'High-level status overview and resource allocation monitoring.';
      case 'Client':
        return 'Incident status updates and business impact visibility.';
      default:
        return '';
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Incident Response Progress</h2>
      
      {/* Progress Bar */}
      {totalSteps > 0 && (
        <div className="mb-4">
          <div 
            role="progressbar" 
            aria-label="Workflow Progress"
            aria-valuenow={Math.round((currentStep / totalSteps) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-muted rounded-full h-2 mb-2"
          >
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground" aria-label="Current step">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      )}

      {/* Role-based content */}
      {getRoleBasedContent() && (
        <div className="mb-4 text-xs text-muted-foreground p-2 bg-muted/50 rounded">
          {getRoleBasedContent()}
        </div>
      )}
      
      {/* Error States */}
      {!alertId && (
        <div className="text-center text-muted-foreground mb-4">
          No active workflow
        </div>
      )}

      <div className="space-y-3">
        {stepHistory && stepHistory.length > 0 ? stepHistory.map((step, index) => {
          const status = step.completed ? "completed" : (index === currentStep - 1 ? "active" : "pending");
          const isFutureStep = index >= currentStep;
          
          return (
            <div
              key={step.step}
              onClick={() => !isFutureStep && onPhaseClick?.(step.title)}
              tabIndex={status === "active" || status === "completed" ? 0 : -1}
              role="button"
              aria-current={status === "active" ? "step" : undefined}
              aria-describedby={`step-${step.step}-desc`}
              className={`workflow-step ${status} p-3 rounded-lg border-l-4 transition-colors ${
                status === "active" ? "border-primary" : "border-muted"
              } ${isFutureStep ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50"}`}
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
        }) : WORKFLOW_PHASES.map((phase) => {
          const status = getPhaseStatus(phase.id);
          return (
            <div
              key={phase.id}
              onClick={() => onPhaseClick?.(phase.id)}
              tabIndex={0}
              role="button"
              aria-current={status === "active" ? "step" : undefined}
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
        <h3 className="text-md font-semibold mb-3">MITRE ATT&CK Analysis</h3>
        <div className="space-y-3">
          {MITRE_TECHNIQUES.map((technique) => (
            <div
              key={technique.id}
              className={`${
                technique.status === "Active" 
                  ? "bg-destructive/10 border-destructive/20" 
                  : technique.status === "Detected"
                  ? "bg-warning/10 border-warning/20"
                  : "bg-info/10 border-info/20"
              } border rounded-lg p-3`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{technique.id}</span>
                  <span className="text-xs text-muted-foreground">({technique.tactic})</span>
                </div>
                <Badge 
                  variant={
                    technique.status === "Active" ? "destructive" : 
                    technique.status === "Detected" ? "secondary" : "outline"
                  }
                  className="text-xs"
                >
                  {technique.status}
                </Badge>
              </div>
              <p className="text-sm font-medium mb-1">{technique.name}</p>
              <p className="text-xs text-muted-foreground mb-2">{technique.description}</p>
              
              {userRole === "Analyst" && (
                <>
                  <div className="text-xs bg-info/20 p-2 rounded mb-1">
                    <strong>Why This Matters:</strong> {technique.whyItMatters}
                  </div>
                  <div className="text-xs bg-primary/20 p-2 rounded">
                    <strong>Howard Context:</strong> {technique.howardContext}
                  </div>
                </>
              )}
              
              {userRole === "Manager" && (
                <div className="text-xs bg-warning/20 p-2 rounded">
                  <strong>Business Impact:</strong> {technique.tacticName} - Requires immediate escalation
                </div>
              )}
              
              {userRole === "Client" && (
                <div className="text-xs bg-success/20 p-2 rounded">
                  <strong>Status:</strong> Security team is actively addressing this threat vector
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
