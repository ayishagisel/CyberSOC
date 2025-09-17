import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import WorkflowTracker from "@/components/WorkflowTracker";
import AlertCard from "@/components/AlertCard";
import AssetTable from "@/components/AssetTable";
import LogViewer from "@/components/LogViewer";
import AIAssistantPanel from "@/components/AIAssistantPanel";
import ReportGenerator from "@/components/ReportGenerator";
import type { Alert, Endpoint, LogEntry } from "@shared/schema";
import { useWorkflow } from "@/hooks/use-workflow";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<"Analyst" | "Manager" | "Client">("Analyst");
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const { currentNode, workflow } = useWorkflow(selectedAlert);

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<Endpoint[]>({
    queryKey: ["/api/endpoints"],
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
  });

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

  const criticalAlerts = alerts.filter(alert => alert.severity === "Critical");
  const activeAlert = selectedAlert ? alerts.find(a => a.id === selectedAlert) : criticalAlerts[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar userRole={userRole} onRoleChange={setUserRole} />
      
      <div className="flex h-screen overflow-hidden">
        <WorkflowTracker 
          currentPhase={currentNode?.phase || "Detection"}
          completedPhases={workflow?.completed_nodes || []}
          mitreAttackTechniques={activeAlert?.mitre_tactics || []}
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
              onAction={(action) => console.log("Action:", action)}
              data-testid="ai-assistant-panel"
            />
          )}
        </div>
      </div>
    </div>
  );
}
