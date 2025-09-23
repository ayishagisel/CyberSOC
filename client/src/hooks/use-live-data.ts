import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

interface LiveDataHookOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Import the actual types from the schema to ensure compatibility
import type { Alert, Endpoint } from "@shared/schema";

interface LiveAlert extends Omit<Alert, 'timestamp' | 'affected_endpoints' | 'mitre_tactics'> {
  createdDateTime: string;
  mitreAttackTechniques: string[];
  endpoint?: {
    id: string;
    name: string;
    ip: string;
  };
  user?: {
    upn: string;
    account: string;
    domain: string;
  };
}

interface LiveEndpoint extends Omit<Endpoint, 'ip_address' | 'user' | 'department'> {
  name: string;
  ip?: string;
  osVersion: string;
  lastSeen: string;
  owner: string;
}

interface LiveDataResponse<T> {
  source: 'microsoft-graph' | 'mock' | 'mock-fallback';
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

// Transformation functions to ensure compatibility
function transformLiveAlertToAlert(liveAlert: LiveAlert): Alert {
  return {
    ...liveAlert,
    timestamp: new Date(liveAlert.createdDateTime),
    affected_endpoints: liveAlert.endpoint ? [liveAlert.endpoint.id] : [],
    mitre_tactics: liveAlert.mitreAttackTechniques,
    severity: liveAlert.severity.charAt(0).toUpperCase() + liveAlert.severity.slice(1) as Alert['severity'],
    status: transformStatus(liveAlert.status)
  };
}

function transformLiveEndpointToEndpoint(liveEndpoint: LiveEndpoint): Endpoint {
  return {
    ...liveEndpoint,
    ip_address: liveEndpoint.ip || '0.0.0.0',
    user: liveEndpoint.owner,
    department: null,
    status: transformEndpointStatus(liveEndpoint.status)
  };
}

function transformStatus(status: string): Alert['status'] {
  const statusMap: { [key: string]: Alert['status'] } = {
    'open': 'New',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Dismissed'
  };
  return statusMap[status] || 'New';
}

function transformEndpointStatus(status: string): Endpoint['status'] {
  const statusMap: { [key: string]: Endpoint['status'] } = {
    'healthy': 'Normal',
    'compromised': 'Affected'
  };
  return statusMap[status] || 'Normal';
}

export function useLiveData(options: LiveDataHookOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const [useLiveData, setUseLiveData] = useState(false);

  // Check live data status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['live-data-status'],
    queryFn: async () => {
      const response = await fetch('/api/live/status');
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch live alerts
  const {
    data: alertsResponse,
    refetch: refetchAlerts,
    isLoading: alertsLoading,
    error: alertsError
  } = useQuery({
    queryKey: ['live-alerts', useLiveData],
    queryFn: async (): Promise<LiveDataResponse<LiveAlert[]>> => {
      const endpoint = useLiveData ? '/api/live/alerts' : '/api/alerts';
      const response = await fetch(endpoint);
      const data = await response.json();

      if (endpoint === '/api/alerts') {
        // Transform mock data to match live data format
        return {
          source: 'mock',
          data: data,
          count: data.length
        };
      }

      return {
        source: data.source,
        data: data.alerts || [],
        count: data.count,
        message: data.message,
        error: data.error
      };
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch live endpoints
  const {
    data: endpointsResponse,
    refetch: refetchEndpoints,
    isLoading: endpointsLoading,
    error: endpointsError
  } = useQuery({
    queryKey: ['live-endpoints', useLiveData],
    queryFn: async (): Promise<LiveDataResponse<LiveEndpoint[]>> => {
      const endpoint = useLiveData ? '/api/live/endpoints' : '/api/endpoints';
      const response = await fetch(endpoint);
      const data = await response.json();

      if (endpoint === '/api/endpoints') {
        return {
          source: 'mock',
          data: data,
          count: data.length
        };
      }

      return {
        source: data.source,
        data: data.endpoints || [],
        count: data.count,
        message: data.message,
        error: data.error
      };
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch security incidents
  const {
    data: incidentsResponse,
    refetch: refetchIncidents,
    isLoading: incidentsLoading
  } = useQuery({
    queryKey: ['live-incidents', useLiveData],
    queryFn: async () => {
      if (!useLiveData) {
        return { source: 'mock', data: [], count: 0 };
      }

      const response = await fetch('/api/live/incidents');
      const data = await response.json();

      return {
        source: data.source,
        data: data.incidents || [],
        count: data.count,
        message: data.message
      };
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: useLiveData, // Only fetch when live data is enabled
  });

  // Fetch security score
  const {
    data: securityScoreResponse,
    refetch: refetchSecurityScore,
    isLoading: securityScoreLoading
  } = useQuery({
    queryKey: ['live-security-score', useLiveData],
    queryFn: async () => {
      const response = await fetch('/api/live/security-score');
      const data = await response.json();

      return {
        source: data.source,
        data: data.score,
        message: data.message,
        error: data.error
      };
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Refresh all data
  const refreshAll = useCallback(() => {
    refetchStatus();
    refetchAlerts();
    refetchEndpoints();
    refetchIncidents();
    refetchSecurityScore();
  }, [refetchStatus, refetchAlerts, refetchEndpoints, refetchIncidents, refetchSecurityScore]);

  // Set live data preference
  const setLiveDataEnabled = useCallback((enabled: boolean) => {
    if (!status?.microsoftGraph?.configured && enabled) {
      console.warn('Cannot enable live data: Microsoft Graph not configured');
      return;
    }
    setUseLiveData(enabled);
  }, [status?.microsoftGraph?.configured]);

  return {
    // Status
    status,
    isConfigured: status?.microsoftGraph?.configured || false,
    useLiveData,
    setLiveDataEnabled,

    // Data - transformed to match existing schema
    alerts: (alertsResponse?.data || []).map(alert =>
      alertsResponse?.source === 'mock' ? alert : transformLiveAlertToAlert(alert as LiveAlert)
    ) as Alert[],
    endpoints: (endpointsResponse?.data || []).map(endpoint =>
      endpointsResponse?.source === 'mock' ? endpoint : transformLiveEndpointToEndpoint(endpoint as LiveEndpoint)
    ) as Endpoint[],
    incidents: incidentsResponse?.data || [],
    securityScore: securityScoreResponse?.data,

    // Metadata
    alertsSource: alertsResponse?.source,
    endpointsSource: endpointsResponse?.source,
    alertsMessage: alertsResponse?.message,
    endpointsMessage: endpointsResponse?.message,

    // Loading states
    isLoading: alertsLoading || endpointsLoading || securityScoreLoading,
    alertsLoading,
    endpointsLoading,
    incidentsLoading,
    securityScoreLoading,

    // Errors
    alertsError,
    endpointsError,

    // Actions
    refreshAll,
    refetchAlerts,
    refetchEndpoints,
    refetchIncidents,
    refetchSecurityScore,
  };
}