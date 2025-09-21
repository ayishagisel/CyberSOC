import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LogEntry } from "@shared/schema";

interface LogViewerProps {
  logs: LogEntry[];
}

const LOG_SOURCES = ["All Sources", "Azure Sentinel", "Defender for Endpoint", "Office 365", "Windows Event Log", "Network Monitor"];
const LOG_SEVERITIES = ["All Severities", "Critical", "High", "Medium", "Low", "Info"];

export default function LogViewer({ logs: initialLogs }: LogViewerProps) {
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [severityFilter, setSeverityFilter] = useState("All Severities");

  const { data: logs = initialLogs } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs", { source: sourceFilter, severity: severityFilter }],
    enabled: sourceFilter !== "All Sources" || severityFilter !== "All Severities",
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "border-l-4 border-critical";
      case "High": return "border-l-4 border-warning";
      case "Medium": return "border-l-4 border-info";
      case "Low": return "border-l-4 border-success";
      case "Info": return "border-l-4 border-primary";
      default: return "border-l-4 border-muted";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical": return <Badge variant="destructive" className="text-xs">CRITICAL</Badge>;
      case "High": return <Badge className="bg-warning text-warning-foreground text-xs">HIGH</Badge>;
      case "Medium": return <Badge className="bg-info text-info-foreground text-xs">MEDIUM</Badge>;
      case "Low": return <Badge className="bg-success text-success-foreground text-xs">LOW</Badge>;
      case "Info": return <Badge variant="secondary" className="text-xs">INFO</Badge>;
      default: return <Badge variant="outline" className="text-xs">{severity}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Security Logs</h3>
        <div className="flex space-x-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48" data-testid="source-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOG_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-48" data-testid="severity-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOG_SEVERITIES.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg h-96" data-testid="log-viewer">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No logs found matching the current filters.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`${getSeverityColor(log.severity)} pl-4 py-2`}
                  data-testid={`log-entry-${log.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">{formatTimestamp(log.timestamp)}</span>
                    {getSeverityBadge(log.severity)}
                  </div>
                  <p className="text-sm mt-1">{log.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Source: {log.source}
                    {log.event_id && ` | EventID: ${log.event_id}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
