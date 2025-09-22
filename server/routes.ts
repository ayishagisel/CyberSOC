import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { MOCK_USERS, type User, insertWorkflowSessionSchema } from "@shared/schema";
import { z } from "zod";

// JWT secret for mock SSO
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return "cybersec-training-secret-key-2025";
})();

// Extended request interface to include user
interface AuthRequest extends Request {
  user?: User;
}

// JWT Middleware
const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    const user = MOCK_USERS.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Optional auth middleware (doesn't block if no token)
const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      const user = MOCK_USERS.find(u => u.id === decoded.userId);
      if (user) req.user = user;
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", (req: AuthRequest, res: Response) => {
    const { userType } = req.body;
    
    // Find user based on type selection
    const user = MOCK_USERS.find(u => u.role === userType);
    if (!user) {
      return res.status(400).json({ error: "Invalid user type" });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set secure cookie  
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ user }); // Don't expose token in response body
  });
  
  app.get("/api/auth/me", authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.json({ message: "Logged out successfully" });
  });
  // Alerts endpoints (protected)
  app.get("/api/alerts", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const alerts = await storage.getAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", authenticateJWT, async (req: AuthRequest, res) => {
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

  app.patch("/api/alerts/:id", authenticateJWT, async (req: AuthRequest, res) => {
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

  // Endpoints (protected)
  app.get("/api/endpoints", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const endpoints = await storage.getEndpoints();
      res.json(endpoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch endpoints" });
    }
  });

  app.patch("/api/endpoints/:id", authenticateJWT, async (req: AuthRequest, res) => {
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

  // Logs (protected)
  app.get("/api/logs", authenticateJWT, async (req: AuthRequest, res) => {
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
  app.get("/api/playbooks/:id", authenticateJWT, async (req: AuthRequest, res) => {
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
  app.get("/api/alerts/:alertId/playbook", authenticateJWT, async (req: AuthRequest, res) => {
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
  app.get("/api/workflow-sessions/:alertId", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId } = req.params;
      const session = await storage.getWorkflowSessionByAlertId(alertId);
      if (!session) {
        return res.status(404).json({ error: "No workflow session found for this alert" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow session" });
    }
  });

  app.post("/api/workflow-sessions", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      // Validate request body against schema
      const validatedData = insertWorkflowSessionSchema.omit({ id: true }).parse(req.body);
      const session = await storage.createWorkflowSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Failed to create workflow session:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create workflow session" });
      }
    }
  });

  app.put("/api/workflow-sessions/:id", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const session = await storage.updateWorkflowSession(id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Workflow session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow session" });
    }
  });

  // Reset simulation - clear all workflow sessions and apply selected scenario
  app.post("/api/workflow-sessions/reset", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { scenario } = req.body;
      
      // Validate scenario
      const validScenarios = ["ransomware", "credential-compromise", "phishing"];
      if (!scenario || !validScenarios.includes(scenario)) {
        return res.status(400).json({ error: "Invalid scenario. Must be one of: " + validScenarios.join(", ") });
      }
      
      // Clear all existing workflow sessions for fresh start
      await storage.clearAllWorkflowSessions();
      
      // Apply the selected scenario
      const scenarioResult = await storage.applyScenario(scenario);
      
      res.json({ 
        success: true, 
        scenario,
        activeAlertId: scenarioResult.activeAlertId,
        message: `${scenarioResult.scenarioName} simulation started successfully.` 
      });
    } catch (error) {
      console.error("Failed to reset simulation:", error);
      res.status(500).json({ error: "Failed to reset simulation" });
    }
  });

  // Reports
  app.post("/api/reports/generate", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { sessionId, format, userRole = 'Analyst' } = req.body;
      console.log('Report generation request:', { 
        sessionId, 
        format, 
        userRole, 
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      
      const report = await storage.generateReport(sessionId);
      console.log('Report generated successfully:', { 
        reportId: report.id, 
        sessionId: report.session_id,
        incidentTitle: report.incident_summary?.title 
      });
      
      if (format === 'pdf') {
        console.log('Starting PDF generation...');
        const { PDFGenerator } = await import('./pdf-generator');
        const pdfBuffer = await PDFGenerator.generatePDF({ userRole, report });
        console.log('PDF generated successfully, buffer size:', pdfBuffer.length);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="incident-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdfBuffer);
      } else {
        // Return JSON for other formats (json, txt)
        res.json(report);
      }
    } catch (error) {
      console.error('Report generation error details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionId: req.body.sessionId,
        userRole: req.body.userRole,
        format: req.body.format,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ 
        error: "Failed to generate report", 
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined 
      });
    }
  });

  // Actions
  app.post("/api/actions/isolate-endpoint", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { endpointId } = req.body;
      const endpoint = await storage.updateEndpoint(endpointId, { status: "Isolated" });
      res.json({ success: true, endpoint });
    } catch (error) {
      res.status(500).json({ error: "Failed to isolate endpoint" });
    }
  });

  app.post("/api/actions/isolate-all", authenticateJWT, async (req: AuthRequest, res) => {
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

  app.post("/api/actions/lock-accounts", authenticateJWT, async (req: AuthRequest, res) => {
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

  app.post("/api/actions/reconnect-endpoint", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { endpointId } = req.body;
      const endpoint = await storage.updateEndpoint(endpointId, { status: "Normal" });
      res.json({ success: true, endpoint });
    } catch (error) {
      res.status(500).json({ error: "Failed to reconnect endpoint" });
    }
  });

  app.post("/api/actions/analyze-traffic", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId } = req.body;
      // Simulate network traffic analysis
      const analysisResults = {
        suspiciousConnections: 3,
        blockedIPs: ["192.168.1.100", "10.0.0.50"],
        malwareSignatures: ["Emotet.Variant.A", "Ransomware.Ryuk"],
        networkSegmentationStatus: "Partial"
      };
      
      res.json({ 
        success: true, 
        alertId,
        analysis: analysisResults,
        message: "Network traffic analysis complete" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze network traffic" });
    }
  });

  app.post("/api/workflow/advance", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId, phase } = req.body;
      
      // Create or update workflow session
      const session = await storage.createWorkflowSession({
        alert_id: alertId,
        current_node: phase.toLowerCase() + "_phase",
        started_at: new Date(),
        completed_nodes: ["detection_phase"],
        actions_taken: [{
          timestamp: new Date().toISOString(),
          action: `Advanced to ${phase}`,
          details: { phase, automated: true }
        }],
        status: "Active",
        user_role: "Analyst"
      });
      
      res.json({ 
        success: true, 
        session,
        currentPhase: phase,
        message: `Workflow advanced to ${phase} phase` 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to advance workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
