import { http, HttpResponse } from 'msw'

// Mock data
const mockAlerts = [
  {
    id: 1,
    title: "Suspicious Login Attempt",
    severity: "High",
    timestamp: "2024-01-15T10:30:00Z",
    status: "Active",
    description: "Multiple failed login attempts detected from IP 192.168.1.100",
    source: "auth-system",
    mitre_tactics: ["Initial Access"],
    mitre_techniques: ["T1078 - Valid Accounts"]
  },
  {
    id: 2,
    title: "Unusual Network Traffic",
    severity: "Medium",
    timestamp: "2024-01-15T11:15:00Z",
    status: "Investigating",
    description: "Abnormal data transfer detected to external IP",
    source: "network-monitor",
    mitre_tactics: ["Exfiltration"],
    mitre_techniques: ["T1041 - Exfiltration Over C2 Channel"]
  }
]

const mockEndpoints = [
  {
    id: 1,
    hostname: "WS-001",
    ip_address: "192.168.1.10",
    status: "Isolated",
    last_seen: "2024-01-15T10:25:00Z",
    risk_score: 85,
    os: "Windows 10",
    department: "Finance"
  },
  {
    id: 2,
    hostname: "WS-002",
    ip_address: "192.168.1.11",
    status: "Online",
    last_seen: "2024-01-15T11:30:00Z",
    risk_score: 25,
    os: "Windows 11",
    department: "HR"
  }
]

const mockWorkflowSessions = [
  {
    id: "session_1",
    user_id: "analyst_1",
    workflow_type: "phishing",
    current_step: 2,
    steps_completed: ["initial_assessment", "containment"],
    session_data: {
      incident_severity: "High",
      affected_users: ["user1@company.com", "user2@company.com"]
    },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T11:00:00Z"
  }
]

export const handlers = [
  // Alerts API
  http.get('/api/alerts', () => {
    return HttpResponse.json(mockAlerts)
  }),

  http.get('/api/alerts/:id', ({ params }) => {
    const alert = mockAlerts.find(a => a.id === parseInt(params.id as string))
    if (!alert) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(alert)
  }),

  // Endpoints API
  http.get('/api/endpoints', () => {
    return HttpResponse.json(mockEndpoints)
  }),

  http.post('/api/actions/isolate-endpoint', async ({ request }) => {
    const body = await request.json() as { endpointId: number }
    return HttpResponse.json({
      success: true,
      message: `Endpoint ${body.endpointId} isolated successfully`
    })
  }),

  // Workflow Sessions API
  http.get('/api/workflow-sessions', () => {
    return HttpResponse.json(mockWorkflowSessions)
  }),

  http.post('/api/workflow-sessions', async ({ request }) => {
    const body = await request.json() as any
    const newSession = {
      id: `session_${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return HttpResponse.json(newSession, { status: 201 })
  }),

  http.put('/api/workflow-sessions/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const updatedSession = {
      id: params.id,
      ...body,
      updated_at: new Date().toISOString()
    }
    return HttpResponse.json(updatedSession)
  }),

  // Playbooks API
  http.get('/api/playbooks/:type', ({ params }) => {
    const mockPlaybook = {
      id: `playbook_${params.type}`,
      name: `${params.type} Response Playbook`,
      steps: [
        { id: "step1", name: "Initial Assessment", completed: false },
        { id: "step2", name: "Containment", completed: false },
        { id: "step3", name: "Investigation", completed: false },
        { id: "step4", name: "Recovery", completed: false }
      ]
    }
    return HttpResponse.json(mockPlaybook)
  }),

  // Reports API
  http.post('/api/reports/generate', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      reportId: `report_${Date.now()}`,
      format: body.format,
      downloadUrl: `/api/reports/download/report_${Date.now()}.${body.format}`
    })
  }),

  // Authentication
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string; role: string }
    if (body.username && body.password) {
      return HttpResponse.json({
        success: true,
        user: {
          id: 1,
          username: body.username,
          role: body.role || 'analyst'
        },
        token: 'mock-jwt-token'
      })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  // Logs API
  http.get('/api/logs', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const severity = url.searchParams.get('severity') || ''

    const mockLogs = [
      {
        id: 1,
        timestamp: "2024-01-15T10:30:15Z",
        level: "ERROR",
        source: "authentication",
        message: "Failed login attempt for user: admin",
        details: { ip: "192.168.1.100", user_agent: "Mozilla/5.0" }
      },
      {
        id: 2,
        timestamp: "2024-01-15T10:31:22Z",
        level: "WARN",
        source: "network",
        message: "Unusual outbound connection detected",
        details: { destination: "suspicious-domain.com", port: 443 }
      }
    ]

    let filteredLogs = mockLogs
    if (search) {
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.level === severity)
    }

    return HttpResponse.json(filteredLogs)
  })
]