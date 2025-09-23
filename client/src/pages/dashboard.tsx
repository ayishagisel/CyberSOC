import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import WorkflowTracker from "@/components/WorkflowTracker";
import AlertCard from "@/components/AlertCard";
import AssetTable from "@/components/AssetTable";
import LogViewer from "@/components/LogViewer";
import AIAssistantPanel from "@/components/AIAssistantPanel";
import ReportGenerator from "@/components/ReportGenerator";
import BusinessImpactMetrics from "@/components/BusinessImpactMetrics";
import type { Alert, Endpoint, LogEntry } from "@shared/schema";
import { useWorkflow } from "@/hooks/use-workflow";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<"Analyst" | "Manager" | "Client">("Analyst");
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  // const queryClient = useQueryClient();
  
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<Endpoint[]>({
    queryKey: ["/api/endpoints"],
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
  });

  // Calculate active alert for workflow - must be done before any early returns
  const criticalAlerts = alerts.filter(alert => alert.severity === "Critical");
  const activeAlert = selectedAlert ? alerts.find(a => a.id === selectedAlert) : criticalAlerts[0];
  
  // Initialize workflow hook with the active alert - this must always be called
  const { currentNode, workflow, advanceWorkflow, playbook } = useWorkflow(activeAlert?.id || null);

  // Map current workflow node to Howard University phase
  const getCurrentPhase = (): "Preparation" | "Identification" | "Containment" | "Eradication" | "Recovery" | "Lessons Learned" => {
    if (!currentNode?.id) return "Identification";
    
    const nodeToPhaseMap: Record<string, "Preparation" | "Identification" | "Containment" | "Eradication" | "Recovery" | "Lessons Learned"> = {
      "preparation_phase": "Preparation",
      "identification_phase": "Identification", 
      "containment_phase": "Containment",
      "eradication_phase": "Eradication",
      "recovery_phase": "Recovery",
      "lessons_learned_phase": "Lessons Learned"
    };
    
    return nodeToPhaseMap[currentNode.id] || "Identification";
  };

  if (alertsLoading || endpointsLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  console.log('Dashboard state:', { selectedAlert, criticalAlerts: criticalAlerts.map(a => a.id), activeAlert: activeAlert?.id, workflowAlertId: activeAlert?.id });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar userRole={userRole} onRoleChange={setUserRole} />
      
      <div className="flex h-screen overflow-hidden">
        <WorkflowTracker
          alertId={activeAlert?.id || ""}
          userRole={userRole}
          onPhaseClick={(phaseId) => {
            console.log('Phase clicked:', phaseId, 'for alert:', selectedAlert);

            // Map UI phase names to playbook node IDs
            const phaseToNodeMap: Record<string, string> = {
              "Preparation": "preparation_phase",
              "Identification": "identification_phase", 
              "Containment": "containment_phase",
              "Eradication": "eradication_phase",
              "Recovery": "recovery_phase",
              "Lessons Learned": "lessons_learned_phase"
            };

            const nodeId = phaseToNodeMap[phaseId];
            console.log('Mapped to nodeId:', nodeId, 'playbook exists:', !!playbook, 'node exists:', !!(playbook?.nodes as Record<string, any>)?.[nodeId]);

            if (nodeId && (playbook?.nodes as Record<string, any>)?.[nodeId]) {
              console.log('Calling advanceWorkflow with:', nodeId);
              advanceWorkflow(nodeId, `Advanced to ${phaseId} phase`);
            } else {
              console.log('Cannot advance workflow - missing node or playbook');
            }
          }}
        />
        
        <div className="flex-1 flex">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">
                {userRole === "Analyst" && "Active Incidents"}
                {userRole === "Manager" && "Incident Overview"}
                {userRole === "Client" && "Security Status"}
              </h2>
              
              {criticalAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onStartInvestigation={() => setSelectedAlert(alert.id)}
                  isSelected={selectedAlert === alert.id}
                  userRole={userRole}
                />
              ))}
            </div>

            {userRole === "Analyst" && (
              <>
                <AssetTable 
                  endpoints={endpoints}
                  selectedAlert={activeAlert}
                />
                
                <LogViewer logs={logs} />
              </>
            )}
            
            {(userRole === "Manager" || userRole === "Client") && (
              <BusinessImpactMetrics 
                selectedAlert={activeAlert}
                endpoints={endpoints}
                userRole={userRole}
              />
            )}

            <ReportGenerator 
              selectedAlert={activeAlert}
              endpoints={endpoints}
              userRole={userRole}
            />
          </div>

          {userRole === "Analyst" && selectedAlert && (
            <AIAssistantPanel
              currentNode={currentNode}
              alertId={selectedAlert}
              onAction={(action) => {
                console.log("Action:", action);
                // Trigger UI refresh after actions  
                // queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
                // queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
              }}
              userRole={userRole}
              currentPhase={getCurrentPhase()}
              data-testid="ai-assistant-panel"
            />
          )}
        </div>
      </div>
    </div>
  );
}
