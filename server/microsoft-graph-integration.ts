import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// Configuration interface for Microsoft Graph
export interface GraphConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  authority?: string;
}

// Custom authentication provider for Microsoft Graph Client
class ClientCredentialAuthProvider implements AuthenticationProvider {
  private msalInstance: ConfidentialClientApplication;

  constructor(private config: GraphConfig) {
    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: config.authority || `https://login.microsoftonline.com/${config.tenantId}`,
      },
    });
  }

  async getAccessToken(): Promise<string> {
    try {
      const response = await this.msalInstance.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default'],
      });

      if (!response?.accessToken) {
        throw new Error('Failed to acquire access token');
      }

      return response.accessToken;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to authenticate with Microsoft Graph');
    }
  }
}

// Microsoft Graph Security API integration class
export class MicrosoftGraphSecurity {
  private graphClient: Client;
  private authProvider: ClientCredentialAuthProvider;

  constructor(config: GraphConfig) {
    this.authProvider = new ClientCredentialAuthProvider(config);
    this.graphClient = Client.initWithMiddleware({
      authProvider: this.authProvider,
    });
  }

  // Fetch security alerts from Microsoft Defender
  async getSecurityAlerts(params?: {
    severity?: 'low' | 'medium' | 'high' | 'informational';
    status?: 'newAlert' | 'inProgress' | 'resolved';
    top?: number;
  }) {
    try {
      let url = '/security/alerts_v2';

      const queryParams = [];
      if (params?.severity) {
        queryParams.push(`$filter=severity eq '${params.severity}'`);
      }
      if (params?.status) {
        queryParams.push(`$filter=status eq '${params.status}'`);
      }
      if (params?.top) {
        queryParams.push(`$top=${params.top}`);
      }

      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }

      const response = await this.graphClient.api(url).get();
      return this.transformAlertsToInternalFormat(response.value || []);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      throw new Error('Failed to fetch security alerts from Microsoft Graph');
    }
  }

  // Fetch security incidents
  async getSecurityIncidents(params?: {
    status?: 'active' | 'resolved' | 'inProgress';
    severity?: 'low' | 'medium' | 'high' | 'informational';
    top?: number;
  }) {
    try {
      let url = '/security/incidents';

      const queryParams = [];
      if (params?.status) {
        queryParams.push(`$filter=status eq '${params.status}'`);
      }
      if (params?.severity) {
        queryParams.push(`$filter=severity eq '${params.severity}'`);
      }
      if (params?.top) {
        queryParams.push(`$top=${params.top}`);
      }

      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }

      const response = await this.graphClient.api(url).get();
      return response.value || [];
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      throw new Error('Failed to fetch security incidents from Microsoft Graph');
    }
  }

  // Fetch device information
  async getDevices(params?: {
    filter?: string;
    top?: number;
  }) {
    try {
      let url = '/deviceManagement/managedDevices';

      const queryParams = [];
      if (params?.filter) {
        queryParams.push(`$filter=${params.filter}`);
      }
      if (params?.top) {
        queryParams.push(`$top=${params.top}`);
      }

      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }

      const response = await this.graphClient.api(url).get();
      return this.transformDevicesToInternalFormat(response.value || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw new Error('Failed to fetch devices from Microsoft Graph');
    }
  }

  // Get security score and recommendations
  async getSecurityScore() {
    try {
      const response = await this.graphClient.api('/security/secureScores').top(1).get();
      return response.value?.[0] || null;
    } catch (error) {
      console.error('Error fetching security score:', error);
      throw new Error('Failed to fetch security score from Microsoft Graph');
    }
  }

  // Transform Microsoft Graph alerts to our internal format
  private transformAlertsToInternalFormat(alerts: any[]) {
    return alerts.map(alert => ({
      id: alert.id,
      title: alert.title || 'Security Alert',
      severity: this.mapSeverity(alert.severity),
      status: this.mapStatus(alert.status),
      category: alert.category || 'Unknown',
      description: alert.description || '',
      createdDateTime: alert.createdDateTime,
      lastModifiedDateTime: alert.lastModifiedDateTime,
      assignedTo: alert.assignedTo,
      classification: alert.classification,
      determination: alert.determination,
      detectorId: alert.detectorId,
      serviceSource: alert.serviceSource,
      // Map to MITRE ATT&CK techniques if available
      mitreAttackTechniques: this.extractMitreTechniques(alert),
      // Transform evidence and entities
      evidence: alert.evidence || [],
      // Add our internal fields
      endpoint: this.extractEndpointInfo(alert),
      user: this.extractUserInfo(alert),
      workflowStatus: 'pending'
    }));
  }

  // Transform Microsoft Graph devices to our internal format
  private transformDevicesToInternalFormat(devices: any[]) {
    return devices.map(device => ({
      id: device.id,
      name: device.deviceName || device.displayName,
      hostname: device.deviceName,
      ip: device.wifiMacAddress, // Approximate - Graph doesn't always have IP
      os: device.operatingSystem,
      osVersion: device.osVersion,
      status: device.complianceState === 'compliant' ? 'healthy' : 'compromised',
      lastSeen: device.lastSyncDateTime,
      owner: device.userPrincipalName,
      deviceType: device.deviceType,
      enrollmentType: device.deviceEnrollmentType,
      isEncrypted: device.isEncrypted,
      jailBroken: device.jailBroken
    }));
  }

  // Helper methods for data transformation
  private mapSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: { [key: string]: 'low' | 'medium' | 'high' | 'critical' } = {
      'informational': 'low',
      'low': 'low',
      'medium': 'medium',
      'high': 'high'
    };
    return severityMap[severity?.toLowerCase()] || 'medium';
  }

  private mapStatus(status: string): 'open' | 'in_progress' | 'resolved' | 'closed' {
    const statusMap: { [key: string]: 'open' | 'in_progress' | 'resolved' | 'closed' } = {
      'newAlert': 'open',
      'inProgress': 'in_progress',
      'resolved': 'resolved',
      'dismissed': 'closed'
    };
    return statusMap[status] || 'open';
  }

  private extractMitreTechniques(alert: any): string[] {
    // Extract MITRE ATT&CK techniques from alert evidence or description
    const techniques: string[] = [];

    // Check if alert has MITRE technique info in evidence
    if (alert.evidence) {
      alert.evidence.forEach((evidence: any) => {
        if (evidence.mdeDeviceId || evidence.detectionSource) {
          // Common techniques based on detection source
          if (evidence.detectionSource?.includes('PowerShell')) {
            techniques.push('T1059.001'); // PowerShell
          }
          if (evidence.detectionSource?.includes('WMI')) {
            techniques.push('T1047'); // Windows Management Instrumentation
          }
        }
      });
    }

    // Extract from title/description patterns
    const alertText = `${alert.title} ${alert.description}`.toLowerCase();
    if (alertText.includes('ransomware') || alertText.includes('encryption')) {
      techniques.push('T1486'); // Data Encrypted for Impact
    }
    if (alertText.includes('credential') || alertText.includes('password')) {
      techniques.push('T1078'); // Valid Accounts
    }
    if (alertText.includes('lateral movement')) {
      techniques.push('T1021'); // Remote Services
    }

    return Array.from(new Set(techniques)); // Remove duplicates
  }

  private extractEndpointInfo(alert: any) {
    // Extract endpoint information from alert evidence
    const evidence = alert.evidence || [];
    const deviceEvidence = evidence.find((e: any) => e.mdeDeviceId || e.deviceDnsName);

    if (deviceEvidence) {
      return {
        id: deviceEvidence.mdeDeviceId,
        name: deviceEvidence.deviceDnsName,
        ip: deviceEvidence.ipAddress
      };
    }

    return null;
  }

  private extractUserInfo(alert: any) {
    // Extract user information from alert evidence
    const evidence = alert.evidence || [];
    const userEvidence = evidence.find((e: any) => e.userPrincipalName || e.accountName);

    if (userEvidence) {
      return {
        upn: userEvidence.userPrincipalName,
        account: userEvidence.accountName,
        domain: userEvidence.domainName
      };
    }

    return null;
  }
}

// Factory function to create Graph client with environment variables
export function createGraphClient(): MicrosoftGraphSecurity | null {
  const config = {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.AZURE_TENANT_ID,
  };

  // Validate required environment variables
  if (!config.clientId || !config.clientSecret || !config.tenantId) {
    console.warn('Microsoft Graph integration disabled: Missing Azure credentials');
    return null;
  }

  return new MicrosoftGraphSecurity(config as GraphConfig);
}