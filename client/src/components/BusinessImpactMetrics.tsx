import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Users, 
  Clock, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Building
} from "lucide-react";
import type { Alert, Endpoint } from "@shared/schema";

interface BusinessImpactMetricsProps {
  selectedAlert?: Alert;
  endpoints: Endpoint[];
  userRole: "Manager" | "Client";
}

interface BusinessMetric {
  id: string;
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
  severity: "low" | "medium" | "high" | "critical";
  icon: React.ComponentType<{ className?: string }>;
}

interface OperationalMetric {
  id: string;
  name: string;
  status: "operational" | "degraded" | "offline";
  impact: number; // 0-100
  estimatedRecovery: string;
}

export default function BusinessImpactMetrics({ 
  selectedAlert, 
  endpoints, 
  userRole 
}: BusinessImpactMetricsProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [incidentDuration, setIncidentDuration] = useState(0); // minutes
  
  // Update current time every 30 seconds for real-time feel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setIncidentDuration(prev => prev + 0.5); // Simulate time progression
    }, 30000);
    
    return () => clearInterval(timer);
  }, []);

  const affectedEndpoints = selectedAlert 
    ? endpoints.filter(ep => selectedAlert.affected_endpoints.includes(ep.id))
    : [];
    
  const isolatedEndpoints = affectedEndpoints.filter(ep => ep.status === "Isolated");
  const affectedUsers = affectedEndpoints.length * 15; // Estimate users per endpoint
  
  // Calculate business metrics based on incident data
  const getBusinessMetrics = (): BusinessMetric[] => {
    const severity = selectedAlert?.severity || "Medium";
    const baseImpact = severity === "Critical" ? 50000 : 
                     severity === "High" ? 25000 : 
                     severity === "Medium" ? 10000 : 5000;
    
    const hourlyRevenueLoss = Math.round(baseImpact * (affectedEndpoints.length / 10));
    const totalLoss = Math.round(hourlyRevenueLoss * (incidentDuration / 60));
    const recoveryEstimate = Math.round(baseImpact * 0.3);
    
    return [
      {
        id: "revenue-impact",
        label: userRole === "Manager" ? "Revenue Impact" : "Business Impact",
        value: `$${totalLoss.toLocaleString()}`,
        trend: totalLoss > 25000 ? "up" : "stable",
        severity: totalLoss > 50000 ? "critical" : totalLoss > 25000 ? "high" : "medium",
        icon: DollarSign
      },
      {
        id: "affected-users",
        label: userRole === "Manager" ? "Impacted Users" : "Affected People", 
        value: `${affectedUsers.toLocaleString()}`,
        trend: "stable",
        severity: affectedUsers > 100 ? "high" : "medium",
        icon: Users
      },
      {
        id: "downtime-cost",
        label: userRole === "Manager" ? "Downtime Cost/Hr" : "Recovery Cost",
        value: `$${hourlyRevenueLoss.toLocaleString()}`,
        trend: "down",
        severity: hourlyRevenueLoss > 30000 ? "critical" : "high",
        icon: TrendingDown
      },
      {
        id: "recovery-estimate",
        label: "Recovery Investment",
        value: `$${recoveryEstimate.toLocaleString()}`,
        trend: "stable", 
        severity: "medium",
        icon: Building
      }
    ];
  };

  const getOperationalMetrics = (): OperationalMetric[] => {
    return [
      {
        id: "email-services",
        name: "Email Services",
        status: affectedEndpoints.some(ep => ep.hostname.includes("MAIL")) ? "degraded" : "operational",
        impact: affectedEndpoints.some(ep => ep.hostname.includes("MAIL")) ? 65 : 0,
        estimatedRecovery: "2-4 hours"
      },
      {
        id: "file-shares",
        name: "File Sharing",
        status: affectedEndpoints.some(ep => ep.hostname.includes("FINANCE")) ? "offline" : "operational", 
        impact: affectedEndpoints.some(ep => ep.hostname.includes("FINANCE")) ? 85 : 0,
        estimatedRecovery: "4-6 hours"
      },
      {
        id: "customer-portal",
        name: userRole === "Manager" ? "Customer Portal" : "Service Portal",
        status: selectedAlert?.severity === "Critical" ? "degraded" : "operational",
        impact: selectedAlert?.severity === "Critical" ? 45 : 0,
        estimatedRecovery: "1-2 hours"
      },
      {
        id: "internal-systems",
        name: "Internal Systems",
        status: isolatedEndpoints.length > 2 ? "degraded" : "operational",
        impact: isolatedEndpoints.length > 2 ? 30 : 0,
        estimatedRecovery: "2-3 hours"
      }
    ];
  };

  const getMetricSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-critical";
      case "high": return "text-warning"; 
      case "medium": return "text-info";
      case "low": return "text-success";
      default: return "text-muted-foreground";
    }
  };

  const getOperationalStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-success";
      case "degraded": return "text-warning";
      case "offline": return "text-critical";
      default: return "text-muted-foreground";
    }
  };

  const getOperationalStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="w-4 h-4" />;
      case "degraded": return <AlertTriangle className="w-4 h-4" />;
      case "offline": return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const businessMetrics = getBusinessMetrics();
  const operationalMetrics = getOperationalMetrics();
  const responseProgress = Math.min(95, 20 + (isolatedEndpoints.length / affectedEndpoints.length) * 60 + (incidentDuration * 2));

  return (
    <div className="space-y-6">
      {/* Real-time Business Impact Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              {userRole === "Manager" ? "Business Impact Analysis" : "Impact Summary"}
            </span>
            <Badge variant="outline" className="text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {businessMetrics.map((metric) => {
              const IconComponent = metric.icon;
              return (
                <div 
                  key={metric.id}
                  className="p-4 bg-muted/20 rounded-lg border-l-4 border-primary"
                  data-testid={`business-metric-${metric.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className={`w-5 h-5 ${getMetricSeverityColor(metric.severity)}`} />
                    <Badge 
                      variant={metric.trend === "up" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {metric.trend === "up" ? "↗" : metric.trend === "down" ? "↘" : "→"}
                    </Badge>
                  </div>
                  <div className={`text-2xl font-bold ${getMetricSeverityColor(metric.severity)}`}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {metric.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operational Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            {userRole === "Manager" ? "Service Availability" : "System Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {operationalMetrics.map((service) => (
              <div 
                key={service.id} 
                className="flex items-center justify-between p-3 bg-muted/10 rounded-lg"
                data-testid={`operational-metric-${service.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={getOperationalStatusColor(service.status)}>
                    {getOperationalStatusIcon(service.status)}
                  </div>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ETA: {service.estimatedRecovery}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {service.impact > 0 && (
                    <div className="w-20">
                      <Progress value={service.impact} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {service.impact}% impact
                      </div>
                    </div>
                  )}
                  <Badge 
                    variant={service.status === "operational" ? "secondary" : 
                            service.status === "degraded" ? "outline" : "destructive"}
                    className="capitalize"
                  >
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            {userRole === "Manager" ? "Response Progress" : "Recovery Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(responseProgress)}%</span>
              </div>
              <Progress value={responseProgress} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/10 rounded-lg">
                <div className="text-lg font-bold text-primary">
                  {Math.round(incidentDuration)}m
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-lg">
                <div className="text-lg font-bold text-success">
                  {isolatedEndpoints.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {userRole === "Manager" ? "Secured" : "Protected"}
                </div>
              </div>
              
              <div className="p-3 bg-muted/10 rounded-lg">
                <div className="text-lg font-bold text-warning">
                  {affectedEndpoints.length - isolatedEndpoints.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {userRole === "Manager" ? "At Risk" : "Pending"}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Last updated: {currentTime.toLocaleTimeString()}
              </div>
              {userRole === "Client" && (
                <div className="text-sm p-3 bg-info/10 border border-info/20 rounded-lg">
                  <p className="font-medium text-info">Status Update</p>
                  <p>Our security team is actively containing the incident. 
                  Systems are being secured and we expect full restoration within the estimated timeframes.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}