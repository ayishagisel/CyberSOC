import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Key, Mail, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewSimulationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScenarioOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  alertId: string;
  severity: "Critical" | "High";
  estimatedTime: string;
}

const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: "ransomware",
    title: "Ransomware Attack",
    description: "Multiple endpoints infected with ransomware. Practice containment and recovery procedures.",
    icon: Shield,
    alertId: "alert-001",
    severity: "Critical",
    estimatedTime: "20-30 minutes"
  },
  {
    id: "credential-compromise", 
    title: "Credential Compromise",
    description: "Suspicious login activity with evidence of lateral movement. Focus on account security.",
    icon: Key,
    alertId: "alert-004",
    severity: "Critical", 
    estimatedTime: "15-25 minutes"
  },
  {
    id: "phishing",
    title: "Phishing Campaign",
    description: "Malicious email campaign targeting users. Practice email security response.",
    icon: Mail,
    alertId: "alert-005",
    severity: "High",
    estimatedTime: "10-20 minutes"
  }
];

export default function NewSimulationDialog({ open, onOpenChange }: NewSimulationDialogProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startSimulationMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      // Reset all workflow sessions and apply new scenario
      const response = await apiRequest("POST", "/api/workflow-sessions/reset", { scenario: scenarioId });
      const result = await response.json();
      return { 
        scenario: scenarioId, 
        activeAlertId: result.activeAlertId,
        scenarioName: result.message
      };
    },
    onSuccess: (data) => {
      const scenario = SCENARIO_OPTIONS.find(s => s.id === data.scenario);
      toast({
        title: "New Simulation Started",
        description: `${scenario?.title} scenario loaded successfully. Begin with the Detection phase.`,
      });
      
      // Invalidate specific queries to refresh all data with precise query keys
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workflow-sessions", data.activeAlertId] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", data.activeAlertId, "playbook"] });
      
      onOpenChange(false);
      setSelectedScenario(null);
      
      // No page reload - let React Query handle the data refresh
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Simulation",
        description: "Unable to reset simulation state. Please try again.",
        variant: "destructive"
      });
      console.error("Failed to start new simulation:", error);
    }
  });

  const handleStartSimulation = () => {
    if (selectedScenario) {
      startSimulationMutation.mutate(selectedScenario);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="new-simulation-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Start New Incident Simulation
          </DialogTitle>
          <DialogDescription>
            Choose an incident scenario to practice your cybersecurity response skills. 
            This will reset all current progress and start fresh.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-6">
          {SCENARIO_OPTIONS.map((scenario) => {
            const IconComponent = scenario.icon;
            const isSelected = selectedScenario === scenario.id;
            
            return (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
                data-testid={`scenario-${scenario.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-6 h-6 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <div>
                        <CardTitle className="text-lg">{scenario.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            scenario.severity === "Critical" 
                              ? "bg-destructive/10 text-destructive" 
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                          }`}>
                            {scenario.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Est. {scenario.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm">
                    {scenario.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="cancel-simulation"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartSimulation}
            disabled={!selectedScenario || startSimulationMutation.isPending}
            data-testid="start-simulation"
          >
            {startSimulationMutation.isPending ? "Starting..." : "Start Simulation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}