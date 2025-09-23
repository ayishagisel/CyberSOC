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
import { LiveDataStatus } from "@/components/live-data-status";
import type { Alert, Endpoint, LogEntry } from "@shared/schema";
import { useWorkflow } from "@/hooks/use-workflow";
import { useLiveData } from "@/hooks/use-live-data";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<"Analyst" | "Manager" | "Client">("Analyst");
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  // const queryClient = useQueryClient();

  // Use live data hook for alerts and endpoints
  const {
    alerts,
    endpoints,
    isLoading: liveDataLoading,
    alertsSource,
    endpointsSource,
    setLiveDataEnabled,
    isConfigured
  } = useLiveData({ autoRefresh: true, refreshInterval: 30000 });

  // Still use regular query for logs (not available in Graph API yet)
  const { data: logs = [], isLoading: logsLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
  });

  // Loading state combines live data and logs
  const alertsLoading = liveDataLoading;
  const endpointsLoading = liveDataLoading;

  // Calculate active alert for workflow - must be done before any early returns
  const criticalAlerts = alerts.filter(alert => alert.severity === "Critical" || alert.severity === "High");
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

              {/* Live Data Integration Status - Only show for Analysts */}
              {userRole === "Analyst" && (
                <div className="mb-4">
                  <LiveDataStatus onDataSourceChange={setLiveDataEnabled} />
                </div>
              )}

              {/* Data Source Indicator */}
              {alertsSource && (
                <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    {alertsSource === 'microsoft-graph' ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">Live Microsoft Defender Data</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-orange-700">Training Simulation Data</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''} loaded
                  </span>
                </div>
              )}

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
                <div className="mb-4">
                  {/* Endpoints Data Source Indicator */}
                  {endpointsSource && (
                    <div className="mb-2 flex items-center justify-between p-2 bg-muted/20 rounded border">
                      <div className="flex items-center space-x-2">
                        {endpointsSource === 'microsoft-graph' ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-700">Live Device Data</span>
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            <span className="text-xs font-medium text-orange-700">Mock Device Data</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  <AssetTable
                    endpoints={endpoints}
                    selectedAlert={activeAlert}
                  />
                </div>

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
