import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { X, Shield, BookOpen, Clock, Activity, AlertTriangle, CheckCircle, Info, Send, Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PlaybookNode } from "@shared/schema";

interface AIAnalysisResponse {
  analysis: {
    summary: string;
    recommendations: string[];
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    nextSteps: string[];
  };
  context: {
    alertId: string;
    phase: string;
    userRole: string;
    timestamp: string;
  };
}

interface AIChatResponse {
  response: string;
  context: {
    alertId: string;
    phase: string;
    userRole: string;
  };
}

interface AIAssistantPanelProps {
  currentNode?: PlaybookNode;
  alertId: string;
  onAction: (action: string) => void;
  userRole?: "Analyst" | "Manager" | "Client";
  currentPhase?: "Preparation" | "Identification" | "Containment" | "Eradication" | "Recovery" | "Lessons Learned";
}

export default function AIAssistantPanel({ 
  currentNode, 
  alertId, 
  onAction,
  userRole = "Analyst",
  currentPhase
}: AIAssistantPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionTime, setSessionTime] = useState("00:15:32");
  const [actionsTaken, setActionsTaken] = useState(3);
  const [completion, setCompletion] = useState(25);
  const [showTelemetryPopup, setShowTelemetryPopup] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [aiInsights, setAiInsights] = useState<string>("");
  
  // Use props currentPhase or default to Identification
  const activePhase = currentPhase || "Identification";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Howard University Playbook - Simulate Sentinel/Defender telemetry popups
  useEffect(() => {
    const telemetryTimer = setTimeout(() => {
      if (activePhase === "Identification") {
        setShowTelemetryPopup(true);
      }
    }, 3000);
    return () => clearTimeout(telemetryTimer);
  }, [activePhase]);

  // Howard University Playbook phase mapping
  const getPhaseGuidance = (phase: string) => {
    const phaseGuidance: Record<string, any> = {
      "Preparation": {
        title: "Preparation Phase Active",
        prompt: "Azure Sentinel and Defender XDR are monitoring. Annual training protocols verified. Ready for incident detection.",
        reference: "Howard University Playbook v2.0 - Section 4.1: Preparation",
        actions: ["Review Detection Rules", "Verify Backup Systems", "Check Team Readiness"]
      },
      "Identification": {
        title: "SOC Triage with AI Guidance", 
        prompt: "Outbound traffic anomaly detected. MITRE ref: TA0011. Sentinel alert indicates potential ransomware activity. Start guided response?",
        reference: "Howard University Playbook v2.0 - Section 4.2: Identification",
        actions: ["Isolate Endpoints", "Lock User Accounts", "Analyze Network Traffic", "Escalate to Manager"]
      },
      "Containment": {
        title: "Containment Actions Required",
        prompt: "Endpoint isolation and network segmentation using NSGs. Azure AD conditional access lockdown initiated.",
        reference: "Howard University Playbook v2.0 - Section 4.3: Containment", 
        actions: ["Isolate All Endpoints", "Network Segmentation", "Azure AD Lockdown", "Document Actions"]
      },
      "Eradication": {
        title: "Root Cause Analysis",
        prompt: "AI recommendation: Deploy Defender for Endpoint cleansing scripts. Re-image via cloud deployment templates.",
        reference: "Howard University Playbook v2.0 - Section 4.4: Eradication",
        actions: ["Deploy Cleansing Scripts", "Re-image Systems", "Verify Removal", "Update Signatures"]
      },
      "Recovery": {
        title: "System Recovery Phase", 
        prompt: "Restore from OneDrive/SharePoint/Azure BCDR backups. MFA resets and identity re-verification required.",
        reference: "Howard University Playbook v2.0 - Section 4.5: Recovery",
        actions: ["Restore from Backup", "Reset MFA", "Verify Identity", "Apply Hardened Baselines"]
      },
      "Lessons Learned": {
        title: "Post-Incident Analysis",
        prompt: "AI-generated timeline of completed/skipped tasks ready. Post-mortem with annotations scheduled.",
        reference: "Howard University Playbook v2.0 - Section 4.6: Lessons Learned", 
        actions: ["Generate Timeline", "Document Lessons", "Update Procedures", "Schedule Training"]
      }
    };
    return phaseGuidance[phase] || phaseGuidance["Identification"];
  };

  // Role-specific content filtering per Howard University Playbook Section 5
  const getRoleSpecificContent = () => {
    const guidance = getPhaseGuidance(activePhase);
    
    switch (userRole) {
      case "Analyst":
        return {
          ...guidance,
          detail: "Full technical detail with override capabilities. MITRE mapping, Defender logs, Sentinel signals.",
          showTechnical: true,
          showOverrides: true
        };
      case "Manager":
        return {
          ...guidance,
          detail: "SLA status, risk heatmaps, completion %. Summary of impacted units and skipped task flags.",
          showSLA: true,
          showMetrics: true
        };
      case "Client":
        return {
          ...guidance,
          detail: "Plain-language update on business/system impact. Timeline of fix and reassurances.",
          showBusinessImpact: true,
          showTimeline: true
        };
      default:
        return guidance;
    }
  };

  const executeActionMutation = useMutation({
    mutationFn: async (action: string) => {
      let response;
      
      switch (action) {
        case "Isolate All Endpoints":
        case "Isolate Endpoints":
          // Let the backend handle finding affected endpoints
          response = await apiRequest("POST", "/api/actions/isolate-all", {});
          break;
          
        case "Lock User Accounts":
          response = await apiRequest("POST", "/api/actions/lock-accounts", {});
          break;
          
        case "Analyze Network Traffic":
          response = await apiRequest("POST", "/api/actions/analyze-traffic", { 
            alertId 
          });
          break;
          
        case "Escalate to Manager":
          response = await apiRequest("POST", "/api/actions/escalate", { 
            alertId,
            escalationType: "manager",
            reason: "Critical incident requires management oversight"
          });
          break;
          
        case "Network Segmentation":
          response = await apiRequest("POST", "/api/actions/segment-network", { 
            alertId
          });
          break;
          
        case "Azure AD Lockdown":
          response = await apiRequest("POST", "/api/actions/azure-ad-lockdown", { 
            alertId
          });
          break;
          
        case "Review Detection Rules":
        case "Verify Backup Systems":
        case "Check Team Readiness":
        case "Deploy Cleansing Scripts":
        case "Re-image Systems":
        case "Verify Removal":
        case "Update Signatures":
        case "Restore from Backup":
        case "Reset MFA":
        case "Verify Identity":
        case "Apply Hardened Baselines":
        case "Generate Timeline":
        case "Document Lessons":
        case "Update Procedures":
        case "Schedule Training":
          // Simulate Howard University playbook actions
          response = { success: true, message: `${action} completed successfully` };
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      return { success: true, action, data: response };
    },
    onSuccess: (data) => {
      toast({
        title: "Action Completed",
        description: `${data.action} executed successfully.`,
      });
      setActionsTaken(prev => prev + 1);
      setCompletion(prev => Math.min(prev + 10, 100));
      onAction(data.action);
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to execute action.",
        variant: "destructive",
      });
    },
  });

  // AI Analysis Query - Automatically analyze the current incident
  const { data: aiAnalysis, isLoading: aiAnalysisLoading } = useQuery<AIAnalysisResponse>({
    queryKey: ["/api/ai/analyze", alertId, activePhase],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/ai/analyze", {
        alertId,
        currentPhase: activePhase
      });
      return await response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!alertId
  });

  // AI Chat Mutation
  const chatMutation = useMutation<AIChatResponse, Error, string>({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        question,
        alertId,
        currentPhase: activePhase
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setAiInsights(data.response);
      setChatQuestion("");
      toast({
        title: "AI Analysis Complete",
        description: "New insights have been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI response.",
        variant: "destructive",
      });
    },
  });

  const handleAskAI = () => {
    if (chatQuestion.trim()) {
      chatMutation.mutate(chatQuestion.trim());
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
        <Button
          variant="outline"
          onClick={() => setIsMinimized(false)}
          className="w-full"
        >
          <Shield className="w-4 h-4 mr-2" />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="w-96 bg-card border-l border-border p-6 overflow-y-auto" data-testid="ai-assistant-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          AI Assistant
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(true)}
          data-testid="minimize-ai-panel"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Current Step */}
        {/* Howard University Sentinel/Defender Telemetry Popup */}
        {showTelemetryPopup && (
          <Alert className="mb-4 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Azure Sentinel Alert:</strong> Suspicious PowerShell execution detected on HU-FINANCE-PC01. 
              <span className="text-xs block mt-1">MITRE: T1059.001 | Confidence: 95% | Source: Defender for Endpoint</span>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 mr-2"
                onClick={() => setShowTelemetryPopup(false)}
              >
                Acknowledge
              </Button>
              <Button 
                size="sm" 
                onClick={() => { setShowTelemetryPopup(false); executeActionMutation.mutate("Isolate All Endpoints"); }}
              >
                Isolate Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">
                {getRoleSpecificContent().title}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {getRoleSpecificContent().prompt}
              </p>
              <div className="text-xs text-muted-foreground mb-3">
                <span className="font-medium">Reference:</span> {getRoleSpecificContent().reference}
              </div>
              {userRole === "Analyst" && (
                <div className="text-xs bg-info/10 p-2 rounded border">
                  <Info className="w-3 h-3 inline mr-1" />
                  <strong>Why This Matters:</strong> Immediate containment prevents lateral movement. 
                  Skipping this step may delay detection by 3+ hours according to Howard's 2021 incident analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI-Powered Incident Analysis */}
        <div className="bg-gradient-to-r from-primary/5 to-info/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-info rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium mb-2 flex items-center">
                🤖 AI Security Analysis
                {aiAnalysisLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </h4>

              {aiAnalysis?.analysis && (
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Summary:</strong> {aiAnalysis.analysis.summary}
                  </div>

                  {aiAnalysis.analysis.recommendations && (
                    <div className="text-sm">
                      <strong>Top Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                        {aiAnalysis.analysis.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-xs">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs">
                    <Badge variant={
                      aiAnalysis.analysis.riskLevel === "Critical" ? "destructive" :
                      aiAnalysis.analysis.riskLevel === "High" ? "default" :
                      aiAnalysis.analysis.riskLevel === "Medium" ? "secondary" : "outline"
                    }>
                      Risk: {aiAnalysis.analysis.riskLevel}
                    </Badge>
                  </div>
                </div>
              )}

              {/* AI Chat Interface */}
              <div className="mt-4 pt-3 border-t border-primary/10">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask AI about this incident..."
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    disabled={chatMutation.isPending}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleAskAI}
                    disabled={!chatQuestion.trim() || chatMutation.isPending}
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {aiInsights && (
                  <div className="mt-3 p-2 bg-primary/10 rounded text-xs">
                    <strong>💡 AI Insights:</strong><br />
                    {aiInsights}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Howard University Interactive Containment Actions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium mb-3">Recommended Actions</h4>
          <div className="space-y-2">
            {getRoleSpecificContent().actions.map((action: string, index: number) => {
              const actionConfig = {
                "Isolate Endpoints": {
                  icon: "🔒",
                  variant: "default" as const,
                  description: "Azure NSG isolation + Defender quarantine",
                  rationale: "Prevents lateral movement (MITRE: T1021)"
                },
                "Lock User Accounts": {
                  icon: "🔐",
                  variant: "destructive" as const,
                  description: "Azure AD conditional access lockdown",
                  rationale: "Stops credential abuse (MITRE: T1078)"
                },
                "Analyze Network Traffic": {
                  icon: "📊",
                  variant: "secondary" as const,
                  description: "Sentinel log analytics + C2 detection",
                  rationale: "Identifies attack infrastructure"
                },
                "Escalate to Manager": {
                  icon: "📞",
                  variant: "outline" as const,
                  description: "Notify incident commander per SLA",
                  rationale: "Required for Major severity incidents"
                },
                "Network Segmentation": {
                  icon: "🛡️",
                  variant: "default" as const,
                  description: "Deploy Azure NSG emergency rules",
                  rationale: "Contains breach to affected subnet"
                },
                "Azure AD Lockdown": {
                  icon: "🚫",
                  variant: "destructive" as const,
                  description: "Emergency conditional access policies",
                  rationale: "Blocks all non-essential access"
                }
              }[action] || {
                icon: "⚡",
                variant: "secondary" as const,
                description: `Execute ${action}`,
                rationale: "Follow playbook guidance"
              };

              return (
                <Button
                  key={index}
                  onClick={() => executeActionMutation.mutate(action)}
                  disabled={executeActionMutation.isPending}
                  variant={actionConfig.variant}
                  className="w-full p-4 h-auto min-h-[80px] text-left flex flex-col items-start justify-start space-y-1"
                  data-testid={`${action.toLowerCase().replace(/\s+/g, '-')}-action`}
                >
                  <div className="text-sm font-medium flex items-center">
                    <span className="mr-2">{actionConfig.icon}</span>
                    <span>{executeActionMutation.isPending ? "Processing..." : action}</span>
                  </div>
                  <div className="text-xs opacity-80 w-full text-left break-words">
                    {actionConfig.description}
                  </div>
                  {userRole === "Analyst" && (
                    <div className="text-xs opacity-60 italic w-full text-left break-words">
                      {actionConfig.rationale}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Howard University Playbook Reference */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-info flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Howard University Playbook
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Following Microsoft Azure-based response protocols with Zero Trust architecture
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Azure Sentinel: Real-time threat detection</li>
            <li>• Defender for Endpoint: Automated response</li>
            <li>• Conditional Access: Identity protection</li>
            <li>• NIST 800-61 + FERPA compliance</li>
          </ul>
          {userRole === "Manager" && (
            <div className="mt-2 text-xs bg-warning/10 p-2 rounded">
              <strong>SLA Status:</strong> Containment within 1 hour (Target: 45 min)
            </div>
          )}
        </div>
        
        {/* Progress Tracker */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Session Progress
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Time Elapsed
              </span>
              <span className="font-mono">{sessionTime}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Actions Taken</span>
              <span className="font-mono">{actionsTaken} / 12</span>
            </div>
            {userRole === "Manager" && (
              <div className="flex items-center justify-between text-sm">
                <span>SLA Compliance</span>
                <Badge variant={completion > 60 ? "default" : "destructive"}>
                  {completion > 60 ? "On Track" : "At Risk"}
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span>Completion</span>
              <span className="font-mono">{completion}%</span>
            </div>
            <Progress value={completion} className="w-full h-2" />
            {userRole === "Client" && (
              <div className="text-xs text-muted-foreground mt-2">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Systems are being secured. Normal operations expected to resume within 2-4 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
