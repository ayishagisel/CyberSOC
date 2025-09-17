import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Users, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Alert, Endpoint } from "@shared/schema";

interface ReportGeneratorProps {
  selectedAlert?: Alert;
  endpoints: Endpoint[];
  userRole: "Analyst" | "Manager" | "Client";
}

export default function ReportGenerator({ 
  selectedAlert, 
  endpoints, 
  userRole 
}: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReportMutation = useMutation({
    mutationFn: async (format: string) => {
      const response = await apiRequest("POST", "/api/reports/generate", {
        sessionId: "current",
        format
      });
      return response.json();
    },
    onSuccess: (data, format) => {
      // Simulate file download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: format === "pdf" ? "application/pdf" : 
             format === "json" ? "application/json" : "text/plain"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incident-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: `Report has been exported as ${format.toUpperCase()}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    },
  });

  const affectedEndpoints = selectedAlert 
    ? endpoints.filter(ep => selectedAlert.affected_endpoints.includes(ep.id))
    : [];
    
  const isolatedEndpoints = affectedEndpoints.filter(ep => ep.status === "Isolated");
  
  const getMetricIcon = (type: string) => {
    switch (type) {
      case "endpoints": return <Shield className="w-5 h-5 text-primary" />;
      case "isolated": return <Users className="w-5 h-5 text-warning" />;
      case "time": return <Clock className="w-5 h-5 text-success" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const handleExport = (format: string) => {
    generateReportMutation.mutate(format);
  };

  return (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {userRole === "Analyst" && "Incident Report"}
            {userRole === "Manager" && "Executive Summary"}
            {userRole === "Client" && "Status Report"}
          </CardTitle>
          <CardDescription>
            {userRole === "Analyst" && "Technical analysis and response metrics"}
            {userRole === "Manager" && "Business impact and response overview"}
            {userRole === "Client" && "Current status and next steps"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getMetricIcon("endpoints")}
              </div>
              <div className="text-2xl font-bold text-primary">
                {affectedEndpoints.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {userRole === "Client" ? "Systems Affected" : "Affected Endpoints"}
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getMetricIcon("isolated")}
              </div>
              <div className="text-2xl font-bold text-warning">
                {isolatedEndpoints.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {userRole === "Client" ? "Systems Secured" : "Isolated Systems"}
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getMetricIcon("time")}
              </div>
              <div className="text-2xl font-bold text-success">15min</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
          </div>

          {userRole === "Client" && (
            <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-lg">
              <h4 className="font-medium mb-2">Current Status</h4>
              <p className="text-sm text-muted-foreground">
                Our security team has identified and is actively containing a security incident. 
                Affected systems have been isolated to prevent further impact. We will continue 
                to provide updates as the situation develops.
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={() => handleExport("pdf")}
              disabled={generateReportMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="export-pdf-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            
            {userRole === "Analyst" && (
              <>
                <Button
                  onClick={() => handleExport("json")}
                  disabled={generateReportMutation.isPending}
                  variant="secondary"
                  data-testid="export-json-btn"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
                
                <Button
                  onClick={() => handleExport("txt")}
                  disabled={generateReportMutation.isPending}
                  variant="outline"
                  data-testid="export-txt-btn"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as TXT
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
