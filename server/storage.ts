import type { Alert, Endpoint, LogEntry, Playbook, WorkflowSession, Report, InsertAlert, InsertEndpoint, InsertLogEntry, InsertPlaybook, InsertWorkflowSession, InsertReport } from "@shared/schema";
import { alerts, endpoints, logs, playbooks, workflow_sessions, reports } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
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
      generated_at: new Date(),
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

// Reference: Drizzle blueprint integration for database setup
export class DatabaseStorage implements IStorage {
  async getAlerts(): Promise<Alert[]> {
    return db.select().from(alerts).orderBy(desc(alerts.timestamp));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return alert || undefined;
  }

  async getEndpoints(): Promise<Endpoint[]> {
    return db.select().from(endpoints).orderBy(asc(endpoints.hostname));
  }

  async getEndpoint(id: string): Promise<Endpoint | undefined> {
    const [endpoint] = await db.select().from(endpoints).where(eq(endpoints.id, id));
    return endpoint || undefined;
  }

  async updateEndpoint(id: string, updates: Partial<Endpoint>): Promise<Endpoint | undefined> {
    const [endpoint] = await db
      .update(endpoints)
      .set(updates)
      .where(eq(endpoints.id, id))
      .returning();
    return endpoint || undefined;
  }

  async getLogs(filters?: { source?: string; severity?: string; limit?: number }): Promise<LogEntry[]> {
    const conditions = [];
    
    if (filters?.source && filters.source !== "All Sources") {
      conditions.push(eq(logs.source, filters.source));
    }
    
    if (filters?.severity && filters.severity !== "All Severities") {
      conditions.push(eq(logs.severity, filters.severity as any));
    }
    
    let query = db.select().from(logs);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(logs.timestamp));
    
    if (filters?.limit) {
      return result.slice(0, filters.limit);
    }
    
    return result;
  }

  async getPlaybook(id: string): Promise<Playbook | undefined> {
    const [playbook] = await db.select().from(playbooks).where(eq(playbooks.id, id));
    return playbook || undefined;
  }

  async createWorkflowSession(session: Omit<WorkflowSession, "id">): Promise<WorkflowSession> {
    const [newSession] = await db
      .insert(workflow_sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getWorkflowSession(id: string): Promise<WorkflowSession | undefined> {
    const [session] = await db.select().from(workflow_sessions).where(eq(workflow_sessions.id, id));
    return session || undefined;
  }

  async updateWorkflowSession(id: string, updates: Partial<WorkflowSession>): Promise<WorkflowSession | undefined> {
    const [session] = await db
      .update(workflow_sessions)
      .set(updates)
      .where(eq(workflow_sessions.id, id))
      .returning();
    return session || undefined;
  }

  async generateReport(sessionId: string): Promise<Report> {
    const session = await this.getWorkflowSession(sessionId);
    const alert = session ? await this.getAlert(session.alert_id) : null;
    
    const reportData = {
      session_id: sessionId,
      incident_summary: {
        title: alert?.title || "Security Incident",
        severity: alert?.severity || "Medium",
        affected_assets: alert?.affected_endpoints?.length || 0,
        response_time: "15 minutes",
        status: alert?.status || "In Progress"
      },
      timeline: [
        {
          timestamp: new Date().toISOString(),
          phase: "Detection",
          action: "Alert Generated",
          details: alert?.description || "Security incident detected"
        },
        {
          timestamp: new Date().toISOString(),
          phase: "Investigation",
          action: "Analysis Started",
          details: "Incident response team engaged"
        }
      ],
      mitre_techniques: alert?.mitre_tactics || [],
      recommendations: [
        "Implement regular security assessments",
        "Enhance monitoring capabilities",
        "Conduct incident response training"
      ]
    };

    const [report] = await db
      .insert(reports)
      .values(reportData)
      .returning();
    
    return report;
  }
}

// Use DatabaseStorage for database-backed persistence
export const storage = new DatabaseStorage();
