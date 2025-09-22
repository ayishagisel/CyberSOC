import { http, HttpResponse } from 'msw'

// Mock data matching our current application schema and data
const mockAlerts = [
  {
    id: "alert-001",
    title: "Ransomware Detected on 5 Endpoints",
    severity: "Critical",
    status: "New",
    timestamp: "2025-01-17T13:01:00Z",
    affected_endpoints: ["endpoint-01", "endpoint-02", "endpoint-03", "endpoint-04", "endpoint-05"],
    mitre_tactics: ["T1486", "T1059.001"],
    description: "Multiple endpoints in the Finance department have been infected with ransomware. File encryption activity detected across network shares."
  },
  {
    id: "alert-004",
    title: "Credential Compromise - Lateral Movement",
    severity: "Critical",
    status: "New",
    timestamp: "2025-09-17T14:55:43Z",
    affected_endpoints: ["endpoint-03", "endpoint-06", "endpoint-07"],
    mitre_tactics: ["T1078", "T1021.001"],
    description: "Suspicious login activity detected from multiple locations using compromised credentials with evidence of lateral movement."
  },
  {
    id: "alert-005",
    title: "Phishing Email Campaign Detected",
    severity: "High",
    status: "In Progress",
    timestamp: "2025-09-17T09:30:00Z",
    affected_endpoints: ["endpoint-01", "endpoint-02"],
    mitre_tactics: ["T1566.001", "T1204.001"],
    description: "Multiple users have received and potentially clicked on malicious phishing emails containing credential harvesting links."
  }
]

const mockEndpoints = [
  {
    id: "endpoint-01",
    hostname: "HU-FINANCE-PC01",
    ip_address: "10.1.5.12",
    user: "j.doe",
    status: "Isolated",
    os: "Windows 11",
    department: "Finance"
  },
  {
    id: "endpoint-02",
    hostname: "HU-FINANCE-PC02",
    ip_address: "10.1.5.13",
    user: "m.smith",
    status: "Isolated",
    os: "Windows 10",
    department: "Finance"
  },
  {
    id: "endpoint-03",
    hostname: "HU-FINANCE-PC03",
    ip_address: "10.1.5.14",
    user: "a.wilson",
    status: "Affected",
    os: "Windows 11",
    department: "Finance"
  },
  {
    id: "endpoint-04",
    hostname: "HU-FINANCE-PC04",
    ip_address: "10.1.5.15",
    user: "r.johnson",
    status: "Affected",
    os: "Windows 10",
    department: "Finance"
  },
  {
    id: "endpoint-05",
    hostname: "HU-FINANCE-PC05",
    ip_address: "10.1.5.16",
    user: "s.brown",
    status: "Normal",
    os: "Windows 11",
    department: "Finance"
  }
]

const mockLogs = [
  {
    id: "log-001",
    timestamp: "2025-01-17T13:01:23Z",
    source: "Azure Sentinel",
    severity: "Critical",
    message: "File encryption activity detected on HU-FINANCE-PC01",
    event_id: "1116",
    endpoint_id: "endpoint-01",
    raw_data: {
      process_name: "ransomware.exe",
      file_path: "C:\\Users\\j.doe\\Documents\\",
      action: "file_encryption"
    }
  },
  {
    id: "log-002",
    timestamp: "2025-01-17T13:00:45Z",
    source: "Windows Event Log",
    severity: "High",
    message: "PowerShell execution with suspicious parameters detected",
    event_id: "4688",
    endpoint_id: "endpoint-01",
    raw_data: {
      command_line: "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command [base64_encoded_command]",
      parent_process: "winword.exe"
    }
  },
  {
    id: "log-003",
    timestamp: "2025-01-17T12:58:12Z",
    source: "Network Monitor",
    severity: "Medium",
    message: "Unusual network traffic pattern to external IP 185.220.101.32",
    event_id: "NET001",
    raw_data: {
      destination_ip: "185.220.101.32",
      protocol: "HTTPS",
      port: 443,
      bytes_transferred: 1024000
    }
  }
]

// WorkflowSession with all required schema fields
const mockWorkflowSessions = [
  {
    id: "session-001",
    alert_id: "alert-001",
    current_node: "detection_phase",
    started_at: "2025-01-17T13:05:00Z",
    completed_nodes: ["initial_detection"],
    actions_taken: [
      {
        timestamp: "2025-01-17T13:05:00Z",
        action: "workflow_started",
        details: { node: "detection_phase" }
      },
      {
        timestamp: "2025-01-17T13:06:30Z",
        action: "endpoints_isolated",
        details: { count: 5, endpoints: ["endpoint-01", "endpoint-02", "endpoint-03", "endpoint-04", "endpoint-05"] }
      }
    ],
    status: "Active",
    user_role: "Analyst"
  },
  {
    id: "session-004",
    alert_id: "alert-004",
    current_node: "scoping_phase",
    started_at: "2025-09-17T15:00:00Z",
    completed_nodes: ["detection_phase", "initial_assessment"],
    actions_taken: [
      {
        timestamp: "2025-09-17T15:00:00Z",
        action: "workflow_started",
        details: { node: "detection_phase" }
      }
    ],
    status: "Active",
    user_role: "Analyst"
  }
]

// Mock playbook data
const mockPlaybooks = {
  "credential-compromise": {
    id: "credential-compromise",
    name: "Credential Compromise Response",
    description: "Playbook for handling compromised user credentials and lateral movement",
    start_node: "detection_phase",
    nodes: {
      "detection_phase": {
        id: "detection_phase",
        title: "Detection & Initial Assessment",
        ai_prompt: "Analyze the credential compromise indicators and affected systems",
        phase: "Detection",
        options: [
          {
            label: "Begin Investigation",
            action: "start_investigation",
            next_node: "scoping_phase"
          }
        ],
        mitre_techniques: ["T1078", "T1021.001"]
      },
      "scoping_phase": {
        id: "scoping_phase",
        title: "Scope Assessment",
        ai_prompt: "Determine the extent of credential compromise and affected systems",
        phase: "Scoping",
        options: [
          {
            label: "Continue to Investigation",
            action: "scope_complete",
            next_node: "investigation_phase"
          }
        ]
      },
      "investigation_phase": {
        id: "investigation_phase",
        title: "Detailed Investigation",
        ai_prompt: "Investigate attack vectors and timeline",
        phase: "Investigation",
        options: [
          {
            label: "Begin Remediation",
            action: "investigation_complete",
            next_node: "remediation_phase"
          }
        ]
      },
      "remediation_phase": {
        id: "remediation_phase",
        title: "Containment & Remediation",
        ai_prompt: "Contain the threat and remediate affected systems",
        phase: "Remediation",
        options: [
          {
            label: "Complete Incident",
            action: "remediation_complete",
            next_node: "post_incident_phase"
          }
        ]
      },
      "post_incident_phase": {
        id: "post_incident_phase",
        title: "Post-Incident Activities",
        ai_prompt: "Document lessons learned and improve processes",
        phase: "Post-Incident",
        options: []
      }
    }
  }
}

// Mock users for authentication
const mockUsers = [
  {
    id: "user-analyst-1",
    email: "analyst@company.com",
    role: "Analyst"
  },
  {
    id: "user-manager-1",
    email: "manager@company.com",
    role: "Manager"
  },
  {
    id: "user-client-1",
    email: "client@company.com",
    role: "Client"
  }
]

export const handlers = [
  // Authentication API
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('cookie');
    if (authHeader?.includes('auth_token')) {
      return HttpResponse.json({
        user: mockUsers[0] // Default to analyst for tests
      })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { userType: string }
    const user = mockUsers.find(u => u.role === body.userType) || mockUsers[0]
    
    return HttpResponse.json({ user }, {
      headers: {
        'Set-Cookie': 'auth_token=mock-jwt-token; HttpOnly; Path=/'
      }
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ message: "Logged out successfully" }, {
      headers: {
        'Set-Cookie': 'auth_token=; HttpOnly; Path=/; Max-Age=0'
      }
    })
  }),

  // Alerts API
  http.get('/api/alerts', () => {
    return HttpResponse.json(mockAlerts)
  }),

  http.get('/api/alerts/:id', ({ params }) => {
    const alert = mockAlerts.find(a => a.id === params.id)
    if (!alert) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(alert)
  }),

  http.get('/api/alerts/:id/playbook', ({ params }) => {
    // Map alert IDs to playbook types
    const playbookMapping = {
      "alert-001": "ransomware",
      "alert-004": "credential-compromise",
      "alert-005": "phishing"
    }
    const playbookType = playbookMapping[params.id as keyof typeof playbookMapping]
    
    if (playbookType && mockPlaybooks["credential-compromise"]) {
      return HttpResponse.json(mockPlaybooks["credential-compromise"])
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Endpoints API
  http.get('/api/endpoints', () => {
    return HttpResponse.json(mockEndpoints)
  }),

  http.get('/api/endpoints/:id', ({ params }) => {
    const endpoint = mockEndpoints.find(e => e.id === params.id)
    if (!endpoint) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(endpoint)
  }),

  // Logs API
  http.get('/api/logs', ({ request }) => {
    const url = new URL(request.url)
    const source = url.searchParams.get('source')
    const severity = url.searchParams.get('severity')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    let filteredLogs = mockLogs
    if (source) {
      filteredLogs = filteredLogs.filter(log => log.source.toLowerCase().includes(source.toLowerCase()))
    }
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity)
    }

    return HttpResponse.json(filteredLogs.slice(0, limit))
  }),

  // Workflow Sessions API - CRITICAL for our "current" logic
  http.get('/api/workflow-sessions/:alertId', ({ params }) => {
    const session = mockWorkflowSessions.find(s => s.alert_id === params.alertId)
    if (!session) {
      return new HttpResponse(JSON.stringify({ error: "No workflow session found for this alert" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return HttpResponse.json(session)
  }),

  http.post('/api/workflow-sessions', async ({ request }) => {
    const body = await request.json() as any
    const newSession = {
      id: `session-${Date.now()}`,
      ...body,
      started_at: new Date().toISOString(),
      completed_nodes: body.completed_nodes || [],
      actions_taken: body.actions_taken || [],
      status: body.status || "Active"
    }
    mockWorkflowSessions.push(newSession)
    return HttpResponse.json(newSession, { status: 201 })
  }),

  http.put('/api/workflow-sessions/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const sessionIndex = mockWorkflowSessions.findIndex(s => s.id === params.id)
    
    if (sessionIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockWorkflowSessions[sessionIndex] = {
      ...mockWorkflowSessions[sessionIndex],
      ...body
    }
    
    return HttpResponse.json(mockWorkflowSessions[sessionIndex])
  }),

  // Reports API
  http.post('/api/reports/generate', async ({ request }) => {
    const body = await request.json() as { sessionId?: string; format: string; userRole: string }
    
    // Mock report data that matches our schema
    const mockReport = {
      id: `report-${Date.now()}`,
      session_id: body.sessionId || null,
      generated_at: new Date().toISOString(),
      incident_summary: {
        title: "Credential Compromise - Lateral Movement",
        severity: "Critical",
        affected_assets: 3,
        response_time: "15 minutes",
        status: "In Progress"
      },
      timeline: [
        {
          timestamp: new Date().toISOString(),
          phase: "Detection",
          action: "Alert Generated",
          details: "Security incident detected"
        }
      ],
      mitre_techniques: ["T1078", "T1021.001"],
      recommendations: [
        "Implement regular security assessments",
        "Enhance monitoring capabilities",
        "Conduct incident response training"
      ]
    }

    if (body.format === 'pdf') {
      // For PDF format, return a mock PDF buffer
      const pdfContent = `Mock PDF content for ${body.userRole} report`
      return new HttpResponse(pdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="incident-report-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    } else {
      return HttpResponse.json(mockReport)
    }
  }),

  // Actions API
  http.post('/api/actions/isolate-endpoint', async ({ request }) => {
    const body = await request.json() as { endpointId: string }
    const endpointIndex = mockEndpoints.findIndex(e => e.id === body.endpointId)
    
    if (endpointIndex !== -1) {
      mockEndpoints[endpointIndex].status = "Isolated"
    }
    
    return HttpResponse.json({
      success: true,
      endpoint: mockEndpoints[endpointIndex]
    })
  }),

  http.post('/api/actions/isolate-all', async ({ request }) => {
    const body = await request.json() as { endpointIds: string[] }
    
    body.endpointIds.forEach(id => {
      const endpointIndex = mockEndpoints.findIndex(e => e.id === id)
      if (endpointIndex !== -1) {
        mockEndpoints[endpointIndex].status = "Isolated"
      }
    })
    
    return HttpResponse.json({
      success: true,
      message: "All endpoints isolated"
    })
  }),

  http.post('/api/actions/lock-accounts', async () => {
    return HttpResponse.json({
      success: true,
      message: "All user accounts have been locked",
      lockedAccounts: 15
    })
  }),

  // Simulation API
  http.post('/api/simulation/reset', async ({ request }) => {
    const body = await request.json() as { scenario: string }
    
    return HttpResponse.json({
      success: true,
      scenario: body.scenario,
      activeAlertId: "alert-004",
      message: `${body.scenario} simulation started successfully.`
    })
  })
]