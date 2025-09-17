import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Endpoint, Alert } from "@shared/schema";

interface AssetTableProps {
  endpoints: Endpoint[];
  selectedAlert?: Alert;
}

export default function AssetTable({ endpoints, selectedAlert }: AssetTableProps) {
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const affectedEndpoints = selectedAlert 
    ? endpoints.filter(ep => selectedAlert.affected_endpoints.includes(ep.id))
    : endpoints;

  const isolateEndpointMutation = useMutation({
    mutationFn: async (endpointId: string) => {
      await apiRequest("POST", "/api/actions/isolate-endpoint", { endpointId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
      toast({
        title: "Endpoint Isolated",
        description: "The endpoint has been successfully isolated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to isolate endpoint.",
        variant: "destructive",
      });
    },
  });

  const isolateAllMutation = useMutation({
    mutationFn: async (endpointIds: string[]) => {
      await apiRequest("POST", "/api/actions/isolate-all", { endpointIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/endpoints"] });
      setSelectedEndpoints([]);
      toast({
        title: "Endpoints Isolated",
        description: `${selectedEndpoints.length} endpoints have been isolated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to isolate endpoints.",
        variant: "destructive",
      });
    },
  });

  const handleSelectEndpoint = (endpointId: string) => {
    setSelectedEndpoints(prev =>
      prev.includes(endpointId)
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEndpoints.length === affectedEndpoints.length) {
      setSelectedEndpoints([]);
    } else {
      setSelectedEndpoints(affectedEndpoints.map(ep => ep.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Affected":
        return <Badge variant="destructive">Infected</Badge>;
      case "Isolated":
        return <Badge className="bg-warning text-warning-foreground">Isolated</Badge>;
      case "Normal":
        return <Badge variant="secondary">Normal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Affected Assets</h3>
        <div className="flex space-x-2">
          <Button
            onClick={() => isolateAllMutation.mutate(selectedEndpoints)}
            disabled={selectedEndpoints.length === 0 || isolateAllMutation.isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            data-testid="isolate-selected-btn"
          >
            {isolateAllMutation.isPending ? "Isolating..." : "Isolate Selected"}
          </Button>
          <Button
            variant="outline"
            className="border-warning text-warning hover:bg-warning/10"
            data-testid="lock-accounts-btn"
          >
            Lock Accounts
          </Button>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">
                <Checkbox
                  checked={selectedEndpoints.length === affectedEndpoints.length && affectedEndpoints.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="select-all-checkbox"
                />
              </th>
              <th className="text-left p-4 font-medium">Hostname</th>
              <th className="text-left p-4 font-medium">IP Address</th>
              <th className="text-left p-4 font-medium">User</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {affectedEndpoints.map((endpoint) => (
              <tr 
                key={endpoint.id} 
                className="border-t border-border hover:bg-muted/20"
                data-testid={`endpoint-row-${endpoint.id}`}
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedEndpoints.includes(endpoint.id)}
                    onCheckedChange={() => handleSelectEndpoint(endpoint.id)}
                    data-testid={`endpoint-checkbox-${endpoint.id}`}
                  />
                </td>
                <td className="p-4 font-medium">{endpoint.hostname}</td>
                <td className="p-4 text-muted-foreground">{endpoint.ip_address}</td>
                <td className="p-4 text-muted-foreground">{endpoint.user}</td>
                <td className="p-4">
                  {getStatusBadge(endpoint.status)}
                </td>
                <td className="p-4">
                  {endpoint.status === "Affected" ? (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => isolateEndpointMutation.mutate(endpoint.id)}
                      disabled={isolateEndpointMutation.isPending}
                      className="text-primary hover:text-primary/80"
                      data-testid={`isolate-btn-${endpoint.id}`}
                    >
                      {isolateEndpointMutation.isPending ? "Isolating..." : "Isolate"}
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-muted-foreground"
                      data-testid={`reconnect-btn-${endpoint.id}`}
                    >
                      Reconnect
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
