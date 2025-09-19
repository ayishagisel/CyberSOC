import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Alerts endpoints
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Endpoints
  app.get("/api/endpoints", async (req, res) => {
    try {
      const endpoints = await storage.getEndpoints();
      res.json(endpoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch endpoints" });
    }
  });

  app.patch("/api/endpoints/:id", async (req, res) => {
    try {
      const endpoint = await storage.updateEndpoint(req.params.id, req.body);
      if (!endpoint) {
        return res.status(404).json({ error: "Endpoint not found" });
      }
      res.json(endpoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update endpoint" });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const { source, severity, limit } = req.query;
      const logs = await storage.getLogs({
        source: source as string,
        severity: severity as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Playbooks
  app.get("/api/playbooks/:id", async (req, res) => {
    try {
      const playbook = await storage.getPlaybook(req.params.id);
      if (!playbook) {
        return res.status(404).json({ error: "Playbook not found" });
      }
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playbook" });
    }
  });

  // Get playbook for specific alert type
  app.get("/api/alerts/:alertId/playbook", async (req, res) => {
    try {
      const alert = await storage.getAlert(req.params.alertId);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      // Map alert title to playbook ID
      let playbookId = "ransomware-response"; // default
      if (alert.title.toLowerCase().includes("phishing")) {
        playbookId = "phishing-response";
      } else if (alert.title.toLowerCase().includes("credential")) {
        playbookId = "credential-compromise-response";
      }

      const playbook = await storage.getPlaybook(playbookId);
      if (!playbook) {
        return res.status(404).json({ error: "Playbook not found" });
      }
      res.json(playbook);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playbook for alert" });
    }
  });

  // Workflow sessions
  app.post("/api/workflow-sessions", async (req, res) => {
    try {
      const session = await storage.createWorkflowSession(req.body);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create workflow session" });
    }
  });

  // Reports
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const report = await storage.generateReport(sessionId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Actions
  app.post("/api/actions/isolate-endpoint", async (req, res) => {
    try {
      const { endpointId } = req.body;
      const endpoint = await storage.updateEndpoint(endpointId, { status: "Isolated" });
      res.json({ success: true, endpoint });
    } catch (error) {
      res.status(500).json({ error: "Failed to isolate endpoint" });
    }
  });

  app.post("/api/actions/isolate-all", async (req, res) => {
    try {
      const { endpointIds } = req.body;
      const promises = endpointIds.map((id: string) => 
        storage.updateEndpoint(id, { status: "Isolated" })
      );
      await Promise.all(promises);
      res.json({ success: true, message: "All endpoints isolated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to isolate endpoints" });
    }
  });

  app.post("/api/actions/lock-accounts", async (req, res) => {
    try {
      // Simulate locking all user accounts to prevent lateral movement
      res.json({ 
        success: true, 
        message: "All user accounts have been locked",
        lockedAccounts: 15
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to lock accounts" });
    }
  });

  app.post("/api/actions/reconnect-endpoint", async (req, res) => {
    try {
      const { endpointId } = req.body;
      const endpoint = await storage.updateEndpoint(endpointId, { status: "Normal" });
      res.json({ success: true, endpoint });
    } catch (error) {
      res.status(500).json({ error: "Failed to reconnect endpoint" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
