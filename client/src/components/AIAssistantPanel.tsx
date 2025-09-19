import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Shield, BookOpen, Clock, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PlaybookNode } from "@shared/schema";

interface AIAssistantPanelProps {
  currentNode?: PlaybookNode;
  alertId: string;
  onAction: (action: string) => void;
}

export default function AIAssistantPanel({ 
  currentNode, 
  alertId, 
  onAction 
}: AIAssistantPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionTime, setSessionTime] = useState("00:15:32");
  const [actionsTaken, setActionsTaken] = useState(3);
  const [completion, setCompletion] = useState(25);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeActionMutation = useMutation({
    mutationFn: async (action: string) => {
      let response;
      
      switch (action) {
        case "Isolate All Endpoints":
          // Get all affected endpoints from the current alert and isolate them
          const endpointsResponse = await fetch("/api/endpoints");
          const endpoints = await endpointsResponse.json();
          const affectedEndpointIds = endpoints
            .filter((ep: any) => ep.status === "Affected")
            .map((ep: any) => ep.id);
          
          response = await apiRequest("POST", "/api/actions/isolate-all", { 
            endpointIds: affectedEndpointIds 
          });
          break;
          
        case "Lock User Accounts":
          response = await apiRequest("POST", "/api/actions/lock-accounts", {});
          break;
          
        case "Analyze Network Traffic":
          response = await apiRequest("POST", "/api/actions/analyze-traffic", { 
            alertId 
          });
          break;
          
        case "Skip to Investigation":
          response = await apiRequest("POST", "/api/workflow/advance", { 
            alertId,
            phase: "Investigation" 
          });
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
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-medium mb-2">
                {currentNode?.title || "Initial Detection Complete"}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {currentNode?.ai_prompt || 
                  "Critical alert indicates ransomware activity. The AI assistant recommends launching the guided response playbook immediately."
                }
              </p>
              {currentNode?.playbook_reference && (
                <div className="text-xs text-muted-foreground mb-3">
                  <span className="font-medium">Reference:</span> {currentNode.playbook_reference}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recommended Actions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium mb-3">Recommended Actions</h4>
          <div className="space-y-2">
            <Button
              onClick={() => executeActionMutation.mutate("Isolate All Endpoints")}
              disabled={executeActionMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-3 text-sm font-medium text-left"
              data-testid="isolate-all-action"
            >
              <div className="flex items-center">
                🔒 {executeActionMutation.isPending ? "Isolating..." : "Isolate All 5 Endpoints"}
              </div>
              <div className="text-xs mt-1 opacity-80">Immediately quarantine affected systems</div>
            </Button>
            
            <Button
              onClick={() => executeActionMutation.mutate("Lock User Accounts")}
              disabled={executeActionMutation.isPending}
              className="w-full bg-warning hover:bg-warning/90 text-warning-foreground p-3 text-sm font-medium text-left"
              data-testid="lock-accounts-action"
            >
              <div>🔐 Lock User Accounts</div>
              <div className="text-xs mt-1 opacity-80">Prevent lateral movement via compromised credentials</div>
            </Button>
            
            <Button
              onClick={() => executeActionMutation.mutate("Analyze Network Traffic")}
              disabled={executeActionMutation.isPending}
              variant="secondary"
              className="w-full p-3 text-sm font-medium text-left"
              data-testid="analyze-traffic-action"
            >
              <div>📊 Analyze Network Traffic</div>
              <div className="text-xs mt-1 opacity-80">Investigate command & control communications</div>
            </Button>
            
            <Button
              onClick={() => executeActionMutation.mutate("Skip to Investigation")}
              disabled={executeActionMutation.isPending}
              variant="outline"
              className="w-full p-3 text-sm font-medium text-left"
              data-testid="skip-investigation-action"
            >
              <div>⏭️ Skip to Investigation Phase</div>
              <div className="text-xs mt-1 opacity-80">Continue without containment (not recommended)</div>
            </Button>
          </div>
        </div>
        
        {/* Playbook Reference */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-info flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            Playbook Reference
          </h4>
          <p className="text-sm text-muted-foreground mb-2">
            Current step follows NIST Cybersecurity Framework: RESPOND (RS)
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• RS.RP-1: Response plan is executed</li>
            <li>• RS.CO-2: Events are reported</li>
            <li>• RS.AN-1: Notifications from detection systems are investigated</li>
          </ul>
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
            <div className="flex items-center justify-between text-sm">
              <span>Completion</span>
              <span className="font-mono">{completion}%</span>
            </div>
            <Progress value={completion} className="w-full h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
