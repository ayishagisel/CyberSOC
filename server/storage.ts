import type { Alert, Endpoint, LogEntry, Playbook, WorkflowSession, Report } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // Alerts
  getAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;

  // Endpoints
  getEndpoints(): Promise<Endpoint[]>;
  getEndpoint(id: string): Promise<Endpoint | undefined>;
  updateEndpoint(id: string, updates: Partial<Endpoint>): Promise<Endpoint | undefined>;

  // Logs
  getLogs(filters?: { source?: string; severity?: string; limit?: number }): Promise<LogEntry[]>;
  
  // Playbooks
  getPlaybook(id: string): Promise<Playbook | undefined>;
  
  // Workflow Sessions
  createWorkflowSession(session: Omit<WorkflowSession, "id">): Promise<WorkflowSession>;
  getWorkflowSession(id: string): Promise<WorkflowSession | undefined>;
  updateWorkflowSession(id: string, updates: Partial<WorkflowSession>): Promise<WorkflowSession | undefined>;

  // Reports
  generateReport(sessionId: string): Promise<Report>;
}

export class FileStorage implements IStorage {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(import.meta.dirname, "data");
  }

  private async readJsonFile<T>(filename: string): Promise<T[]> {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return [];
    }
  }

  private async writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
    }
  }

  async getAlerts(): Promise<Alert[]> {
    return this.readJsonFile<Alert>("alerts.json");
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const alerts = await this.getAlerts();
    return alerts.find(alert => alert.id === id);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const alerts = await this.getAlerts();
    const index = alerts.findIndex(alert => alert.id === id);
    if (index === -1) return undefined;

    alerts[index] = { ...alerts[index], ...updates };
    await this.writeJsonFile("alerts.json", alerts);
    return alerts[index];
  }

  async getEndpoints(): Promise<Endpoint[]> {
    return this.readJsonFile<Endpoint>("endpoints.json");
  }

  async getEndpoint(id: string): Promise<Endpoint | undefined> {
    const endpoints = await this.getEndpoints();
    return endpoints.find(endpoint => endpoint.id === id);
  }

  async updateEndpoint(id: string, updates: Partial<Endpoint>): Promise<Endpoint | undefined> {
    const endpoints = await this.getEndpoints();
    const index = endpoints.findIndex(endpoint => endpoint.id === id);
    if (index === -1) return undefined;

    endpoints[index] = { ...endpoints[index], ...updates };
    await this.writeJsonFile("endpoints.json", endpoints);
    return endpoints[index];
  }

  async getLogs(filters?: { source?: string; severity?: string; limit?: number }): Promise<LogEntry[]> {
    let logs = await this.readJsonFile<LogEntry>("logs.json");
    
    if (filters?.source && filters.source !== "All Sources") {
      logs = logs.filter(log => log.source === filters.source);
    }
    
    if (filters?.severity && filters.severity !== "All Severities") {
      logs = logs.filter(log => log.severity === filters.severity);
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }
    
    return logs;
  }

  async getPlaybook(id: string): Promise<Playbook | undefined> {
    const playbooks = await this.readJsonFile<Playbook>("playbook.json");
    return playbooks.find(playbook => playbook.id === id);
  }

  async createWorkflowSession(session: Omit<WorkflowSession, "id">): Promise<WorkflowSession> {
    const newSession: WorkflowSession = {
      ...session,
      id: randomUUID(),
    };
    
    // For now, store in memory as this is a demo
    return newSession;
  }

  async getWorkflowSession(id: string): Promise<WorkflowSession | undefined> {
    // For demo purposes, return a mock session
    return undefined;
  }

  async updateWorkflowSession(id: string, updates: Partial<WorkflowSession>): Promise<WorkflowSession | undefined> {
    // For demo purposes
    return undefined;
  }

  async generateReport(sessionId: string): Promise<Report> {
    const report: Report = {
      id: randomUUID(),
      session_id: sessionId,
      generated_at: new Date().toISOString(),
      incident_summary: {
        title: "Ransomware Attack - Financial Department",
        severity: "Critical",
        affected_assets: 5,
        response_time: "15 minutes",
        status: "In Progress"
      },
      timeline: [
        {
          timestamp: "2025-01-17T13:01:00Z",
          phase: "Detection",
          action: "Alert Generated",
          details: "Ransomware detected on 5 endpoints"
        },
        {
          timestamp: "2025-01-17T13:05:00Z",
          phase: "Scoping",
          action: "Impact Assessment",
          details: "Identified affected systems and users"
        }
      ],
      mitre_techniques: ["T1486", "T1059.001"],
      recommendations: [
        "Implement regular backup verification procedures",
        "Enhance endpoint detection capabilities",
        "Conduct ransomware response training"
      ]
    };

    return report;
  }
}

export const storage = new FileStorage();
