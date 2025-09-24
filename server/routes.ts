import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { MOCK_USERS, type User, type DbUser, users, insertWorkflowSessionSchema } from "@shared/schema";
import { z } from "zod";
import { createGraphClient, MicrosoftGraphSecurity } from "./microsoft-graph-integration";
import { eq } from "drizzle-orm";
import { openaiService } from "./openai-service";

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
const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

    // Try to find user in database first
    let user: User | undefined;
    try {
      const dbUser = await storage.findUserById(decoded.userId);
      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role
        };
      }
    } catch (error) {
      // Database lookup failed, fall back to mock users
    }

    // Fall back to mock users if not found in database
    if (!user) {
      user = MOCK_USERS.find(u => u.id === decoded.userId);
    }

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
const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

      // Try to find user in database first
      let user: User | undefined;
      try {
        const dbUser = await storage.findUserById(decoded.userId);
        if (dbUser) {
          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role
          };
        }
      } catch (error) {
        // Database lookup failed, fall back to mock users
      }

      // Fall back to mock users if not found in database
      if (!user) {
        user = MOCK_USERS.find(u => u.id === decoded.userId);
      }

      if (user) req.user = user;
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Microsoft Graph client
  const graphClient = createGraphClient();
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      // Validate input
      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (!["Analyst", "Manager", "Client"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.findUser(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await storage.createUser({
        email,
        password_hash: passwordHash,
        name,
        role: role as "Analyst" | "Manager" | "Client"
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
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

      // Return user without password
      const { password_hash, ...userResponse } = newUser;
      res.status(201).json({ user: userResponse });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, userType } = req.body;

      let user: User;

      if (email && password) {
        // Real login with email/password
        const dbUser = await storage.findUser(email);
        if (!dbUser) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await storage.updateUserLastLogin(dbUser.id);

        // Convert DbUser to User (excluding sensitive fields)
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role
        };

      } else if (userType) {
        // Demo login with role selection (for backward compatibility)
        const mockUser = MOCK_USERS.find(u => u.role === userType);
        if (!mockUser) {
          return res.status(400).json({ error: "Invalid user type" });
        }
        user = mockUser;

      } else {
        return res.status(400).json({ error: "Email and password, or userType required" });
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

      res.json({ user });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
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
      const validatedData = insertWorkflowSessionSchema.omit({ id: true }).parse({
        ...req.body,
        status: req.body.status || "Active"
      } as any);
      const session = await storage.createWorkflowSession({
        ...validatedData,
        status: validatedData.status as "Active" | "Completed" | "Paused",
        started_at: validatedData.started_at || new Date(),
        completed_nodes: (validatedData.completed_nodes as string[]) || [],
        actions_taken: validatedData.actions_taken || []
      });
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
        incidentTitle: (report.incident_summary as any)?.title 
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
      
      // If no specific endpointIds provided, isolate all affected endpoints
      if (!endpointIds || endpointIds.length === 0) {
        const endpoints = await storage.getEndpoints();
        const affectedEndpoints = endpoints.filter(ep => ep.status === "Affected" || ep.status === "Normal");
        const promises = affectedEndpoints.map(ep => 
          storage.updateEndpoint(ep.id, { status: "Isolated" })
        );
        await Promise.all(promises);
        res.json({ 
          success: true, 
          message: `All endpoints isolated (${affectedEndpoints.length} total)`,
          isolatedCount: affectedEndpoints.length
        });
      } else {
        const promises = endpointIds.map((id: string) => 
          storage.updateEndpoint(id, { status: "Isolated" })
        );
        await Promise.all(promises);
        res.json({ 
          success: true, 
          message: "All specified endpoints isolated",
          isolatedCount: endpointIds.length
        });
      }
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

  // Howard University Playbook - New Action Endpoints
  app.post("/api/actions/escalate", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId, escalationType, reason } = req.body;
      // Simulate escalation to manager/incident commander
      res.json({ 
        success: true, 
        message: "Incident escalated to management team",
        escalationType,
        reason,
        escalatedTo: "incident-commander@howard.edu",
        priority: "Critical",
        slaTimer: "45 minutes remaining"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to escalate incident" });
    }
  });

  app.post("/api/actions/segment-network", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId } = req.body;
      // Simulate Azure NSG emergency rules deployment
      res.json({ 
        success: true, 
        message: "Network segmentation rules deployed",
        rulesDeployed: [
          "Block-Finance-Subnet-Outbound",
          "Isolate-Affected-VLANs", 
          "Emergency-DMZ-Lockdown"
        ],
        azureNSG: "howard-emergency-nsg-001",
        affectedSubnets: ["192.168.10.0/24", "192.168.20.0/24"]
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to deploy network segmentation" });
    }
  });

  app.post("/api/actions/azure-ad-lockdown", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId } = req.body;
      // Simulate Azure AD conditional access emergency policies
      res.json({ 
        success: true, 
        message: "Azure AD emergency lockdown activated",
        policiesActivated: [
          "Emergency-Block-All-Access",
          "Require-MFA-All-Users",
          "Block-Legacy-Auth"
        ],
        affectedUsers: 1247,
        exemptAccounts: ["emergency-admin@howard.edu"],
        lockdownLevel: "Maximum"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to activate Azure AD lockdown" });
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

  // Microsoft Graph Security API Integration Endpoints
  // Live security alerts from Microsoft Defender
  app.get("/api/live/alerts", optionalAuth, async (req: AuthRequest, res) => {
    try {
      if (!graphClient) {
        // Fallback to mock data when Graph client isn't configured
        const alerts = await storage.getAlerts();
        return res.json({
          source: 'mock',
          alerts: alerts.slice(0, 10),
          message: 'Using mock data - configure Azure credentials for live data'
        });
      }

      const { severity, status, top = 20 } = req.query;
      const alerts = await graphClient.getSecurityAlerts({
        severity: severity as any,
        status: status as any,
        top: parseInt(top as string)
      });

      res.json({
        source: 'microsoft-graph',
        alerts,
        count: alerts.length
      });
    } catch (error) {
      console.error('Error fetching live alerts:', error);
      // Fallback to mock data on error
      const alerts = await storage.getAlerts();
      res.json({
        source: 'mock-fallback',
        alerts: alerts.slice(0, 10),
        error: 'Failed to fetch live data, showing mock data'
      });
    }
  });

  // Live security incidents
  app.get("/api/live/incidents", optionalAuth, async (req: AuthRequest, res) => {
    try {
      if (!graphClient) {
        return res.json({
          source: 'mock',
          incidents: [],
          message: 'Configure Azure credentials for live incident data'
        });
      }

      const { status, severity, top = 10 } = req.query;
      const incidents = await graphClient.getSecurityIncidents({
        status: status as any,
        severity: severity as any,
        top: parseInt(top as string)
      });

      res.json({
        source: 'microsoft-graph',
        incidents,
        count: incidents.length
      });
    } catch (error) {
      console.error('Error fetching live incidents:', error);
      res.status(500).json({ error: 'Failed to fetch security incidents' });
    }
  });

  // Live device/endpoint data
  app.get("/api/live/endpoints", optionalAuth, async (req: AuthRequest, res) => {
    try {
      if (!graphClient) {
        // Fallback to mock data
        const endpoints = await storage.getEndpoints();
        return res.json({
          source: 'mock',
          endpoints,
          message: 'Using mock data - configure Azure credentials for live data'
        });
      }

      const { filter, top = 50 } = req.query;
      const devices = await graphClient.getDevices({
        filter: filter as string,
        top: parseInt(top as string)
      });

      res.json({
        source: 'microsoft-graph',
        endpoints: devices,
        count: devices.length
      });
    } catch (error) {
      console.error('Error fetching live endpoints:', error);
      // Fallback to mock data
      const endpoints = await storage.getEndpoints();
      res.json({
        source: 'mock-fallback',
        endpoints,
        error: 'Failed to fetch live data, showing mock data'
      });
    }
  });

  // Security score and recommendations
  app.get("/api/live/security-score", optionalAuth, async (req: AuthRequest, res) => {
    try {
      if (!graphClient) {
        return res.json({
          source: 'mock',
          score: { currentScore: 75, maxScore: 100, category: 'Medium' },
          message: 'Configure Azure credentials for live security score'
        });
      }

      const securityScore = await graphClient.getSecurityScore();

      res.json({
        source: 'microsoft-graph',
        score: securityScore
      });
    } catch (error) {
      console.error('Error fetching security score:', error);
      res.json({
        source: 'mock-fallback',
        score: { currentScore: 75, maxScore: 100, category: 'Medium' },
        error: 'Failed to fetch live data, showing mock score'
      });
    }
  });

  // Configuration endpoint to check if live data is available
  app.get("/api/live/status", (req, res) => {
    res.json({
      microsoftGraph: {
        configured: !!graphClient,
        endpoints: [
          '/api/live/alerts',
          '/api/live/incidents',
          '/api/live/endpoints',
          '/api/live/security-score'
        ]
      },
      message: graphClient
        ? 'Microsoft Graph integration active - live security data available'
        : 'Microsoft Graph not configured - using mock data. Set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID environment variables'
    });
  });

  // AI Assistant endpoints
  app.post("/api/ai/chat", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { question, alertId, currentPhase } = req.body;

      // Gather incident context
      const alert = alertId ? await storage.getAlert(alertId) : undefined;
      const logs = await storage.getLogs({ limit: 10 }); // Recent logs
      const endpoints = await storage.getEndpoints();

      const context = {
        alert,
        logs,
        endpoints,
        userRole: req.user?.role as "Analyst" | "Manager" | "Client" || "Analyst",
        currentPhase: currentPhase || "Identification",
        question
      };

      const response = await openaiService.generateResponse(context);

      res.json({
        response,
        context: {
          alertId,
          phase: context.currentPhase,
          userRole: context.userRole
        }
      });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/ai/analyze", authenticateJWT, async (req: AuthRequest, res) => {
    try {
      const { alertId, currentPhase } = req.body;

      // Gather full incident context
      const alert = alertId ? await storage.getAlert(alertId) : undefined;
      const logs = await storage.getLogs({ limit: 20 });
      const endpoints = await storage.getEndpoints();

      const context = {
        alert,
        logs,
        endpoints,
        userRole: req.user?.role as "Analyst" | "Manager" | "Client" || "Analyst",
        currentPhase: currentPhase || "Identification"
      };

      const analysis = await openaiService.analyzeIncident(context);

      res.json({
        analysis,
        context: {
          alertId,
          phase: context.currentPhase,
          userRole: context.userRole,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ error: "Failed to analyze incident" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
