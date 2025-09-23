import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Database,
  Shield,
  AlertTriangle,
  Info
} from "lucide-react";

interface LiveDataStatus {
  microsoftGraph: {
    configured: boolean;
    endpoints: string[];
  };
  message: string;
}

interface LiveDataStatusProps {
  onDataSourceChange?: (useLiveData: boolean) => void;
}

export function LiveDataStatus({ onDataSourceChange }: LiveDataStatusProps) {
  const [status, setStatus] = useState<LiveDataStatus | null>(null);
  const [useLiveData, setUseLiveData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/live/status');
      const data = await response.json();
      setStatus(data);
      setUseLiveData(data.microsoftGraph.configured);
    } catch (error) {
      console.error('Failed to fetch live data status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceToggle = (enabled: boolean) => {
    if (!status?.microsoftGraph.configured && enabled) {
      return; // Can't enable live data if not configured
    }
    setUseLiveData(enabled);
    onDataSourceChange?.(enabled);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 animate-pulse" />
            <span>Checking live data connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to check live data status
        </AlertDescription>
      </Alert>
    );
  }

  const isConfigured = status.microsoftGraph.configured;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Live Security Data Integration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Microsoft Graph Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isConfigured ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="font-medium">Microsoft Graph Security API</span>
          </div>
          <Badge variant={isConfigured ? "default" : "destructive"}>
            {isConfigured ? "Connected" : "Not Configured"}
          </Badge>
        </div>

        {/* Data Source Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            {useLiveData ? (
              <Wifi className="h-4 w-4 text-blue-500" />
            ) : (
              <Database className="h-4 w-4 text-orange-500" />
            )}
            <Label htmlFor="data-source-toggle" className="font-medium">
              {useLiveData ? "Live Data" : "Mock Data"}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="data-source-toggle" className="text-sm text-muted-foreground">
              Mock
            </Label>
            <Switch
              id="data-source-toggle"
              checked={useLiveData}
              onCheckedChange={handleDataSourceToggle}
              disabled={!isConfigured}
            />
            <Label htmlFor="data-source-toggle" className="text-sm text-muted-foreground">
              Live
            </Label>
          </div>
        </div>

        {/* Status Message */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            {status.message}
          </AlertDescription>
        </Alert>

        {/* Available Endpoints */}
        {isConfigured && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Available Live Endpoints:</h4>
            <div className="grid grid-cols-2 gap-2">
              {status.microsoftGraph.endpoints.map((endpoint) => (
                <Badge key={endpoint} variant="outline" className="text-xs">
                  {endpoint.replace('/api/live/', '')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Instructions */}
        {!isConfigured && (
          <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="text-sm font-medium flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span>Configuration Required</span>
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              To enable live security data from Microsoft Defender, configure these environment variables:
            </p>
            <div className="space-y-1 text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border text-gray-800 dark:text-gray-200">
              <div>AZURE_CLIENT_ID=your-client-id</div>
              <div>AZURE_CLIENT_SECRET=your-client-secret</div>
              <div>AZURE_TENANT_ID=your-tenant-id</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchStatus}
              className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/20"
            >
              Check Configuration
            </Button>
          </div>
        )}

        {/* Current Data Source Indicator */}
        <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Currently using: <strong className="text-gray-900 dark:text-gray-100">{useLiveData ? "Live Microsoft Defender data" : "Training simulation data"}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}