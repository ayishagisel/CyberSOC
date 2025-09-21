import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Alert } from "@shared/schema";

interface AlertCardProps {
  alert: Alert;
  onStartInvestigation: () => void;
  isSelected: boolean;
  userRole: "Analyst" | "Manager" | "Client";
}

export default function AlertCard({ 
  alert, 
  onStartInvestigation, 
  isSelected, 
  userRole 
}: AlertCardProps) {
  const { toast } = useToast();

  const handleViewDetails = () => {
    toast({
      title: "Alert Details",
      description: `Viewing detailed information for: ${alert.title}`,
    });
  };

  const handleAssignToMe = () => {
    toast({
      title: "Alert Assigned",
      description: `${alert.title} has been assigned to you.`,
    });
  };

  const handleViewStatus = () => {
    toast({
      title: "Status Update",
      description: "Incident response team is actively working on containment.",
    });
  };

  const handleGetUpdates = () => {
    toast({
      title: "Updates Requested",
      description: "You will receive email updates on this incident's progress.",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-critical border-critical text-critical-foreground";
      case "High": return "bg-warning border-warning text-warning-foreground";
      case "Medium": return "bg-info border-info text-info-foreground";
      case "Low": return "bg-success border-success text-success-foreground";
      default: return "bg-muted border-muted text-muted-foreground";
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div 
      className={`bg-card border border-border rounded-lg p-6 mb-4 ${
        alert.severity === "Critical" ? "bg-critical" : ""
      } ${isSelected ? "ring-2 ring-primary" : ""}`}
      data-testid="alert-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{alert.title}</h3>
            <Badge 
              className={`${getSeverityColor(alert.severity)} text-xs font-medium`}
            >
              {alert.severity.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTimestamp(alert.timestamp)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{alert.affected_endpoints.length} endpoints affected</span>
            </div>
          </div>
          
          {userRole === "Analyst" && (
            <div className="flex flex-wrap gap-2 mb-4">
              {alert.affected_endpoints.slice(0, 3).map((endpoint, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {endpoint}
                </Badge>
              ))}
              {alert.affected_endpoints.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{alert.affected_endpoints.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {userRole === "Manager" && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Business Impact: Financial operations affected, potential data encryption detected
              </p>
            </div>
          )}

          {userRole === "Client" && (
            <div className="mb-4">
              <p className="text-sm">
                A security incident has been detected affecting your systems. 
                Our team is actively responding to contain and resolve the issue.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {userRole === "Analyst" && (
            <>
              <Button 
                onClick={onStartInvestigation}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="start-investigation-btn"
              >
                Start Investigation
              </Button>
              <Button 
                onClick={handleViewDetails}
                variant="secondary"
                data-testid="view-details-btn"
              >
                View Details
              </Button>
              <Button 
                onClick={handleAssignToMe}
                variant="outline"
                data-testid="assign-to-me-btn"
              >
                Assign to Me
              </Button>
            </>
          )}
          
          {userRole === "Manager" && (
            <Button 
              onClick={handleViewStatus}
              variant="secondary"
              data-testid="view-status-btn"
            >
              View Status
            </Button>
          )}

          {userRole === "Client" && (
            <Button 
              onClick={handleGetUpdates}
              variant="outline"
              data-testid="get-updates-btn"
            >
              Get Updates
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
