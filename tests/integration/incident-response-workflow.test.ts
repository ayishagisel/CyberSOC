import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import Dashboard from '@/pages/dashboard'
import LoginPage from '@/pages/login'

// Mock data for integration testing
const mockIncidentData = {
  alerts: [
    {
      id: 'alert-ransomware-001',
      title: 'Ransomware Activity Detected',
      severity: 'Critical',
      status: 'Active',
      timestamp: '2024-01-15T10:00:00Z',
      description: 'WannaCry variant detected across multiple endpoints',
      source: 'EDR',
      affected_endpoints: ['WS-001', 'WS-002', 'WS-003'],
      mitre_tactics: ['T1486', 'T1083'],
      recommended_actions: ['Isolate affected endpoints', 'Disable user accounts']
    },
    {
      id: 'alert-phishing-001',
      title: 'Phishing Email Campaign',
      severity: 'High',
      status: 'New',
      timestamp: '2024-01-15T09:30:00Z',
      description: 'Credential harvesting phishing emails detected',
      source: 'Email Security',
      affected_endpoints: ['WS-004'],
      mitre_tactics: ['T1566'],
      recommended_actions: ['Block sender domain', 'Reset user passwords']
    }
  ],
  endpoints: [
    {
      id: 'endpoint-001',
      hostname: 'WS-001',
      ip_address: '192.168.1.100',
      os: 'Windows 10',
      department: 'Finance',
      last_seen: '2024-01-15T10:00:00Z',
      status: 'Infected',
      risk_score: 95
    },
    {
      id: 'endpoint-002',
      hostname: 'WS-002',
      ip_address: '192.168.1.101',
      os: 'Windows 11',
      department: 'HR',
      last_seen: '2024-01-15T09:45:00Z',
      status: 'Isolated',
      risk_score: 85
    }
  ],
  logs: [
    {
      id: 'log-001',
      timestamp: '2024-01-15T10:00:00Z',
      source: 'Windows Event Log',
      severity: 'Critical',
      message: 'Ransomware encryption process detected',
      endpoint_id: 'endpoint-001',
      user_id: 'john.doe',
      process_name: 'wannacry.exe',
      details: { pid: 1234, files_encrypted: 145 }
    },
    {
      id: 'log-002',
      timestamp: '2024-01-15T09:58:00Z',
      source: 'Network Monitor',
      severity: 'High',
      message: 'Suspicious outbound connection to known C2 server',
      endpoint_id: 'endpoint-001',
      user_id: 'john.doe',
      process_name: 'wannacry.exe',
      details: { destination: 'malicious-c2.com', port: 443 }
    }
  ],
  workflowSessions: [
    {
      id: 'session-ransomware-001',
      alert_id: 'alert-ransomware-001',
      user_role: 'Analyst',
      current_node: 'detection_phase',
      started_at: '2025-01-17T13:05:00Z',
      completed_nodes: [],
      actions_taken: [],
      status: 'Active'
    }
  ],
  playbooks: {
    ransomware: {
      id: 'playbook-ransomware',
      title: 'Ransomware Response Playbook',
      nodes: {
        detection_phase: {
          id: 'detection_phase',
          title: 'Detection & Triage',
          description: 'Initial detection and assessment',
          actions: ['Verify alert', 'Assess scope', 'Notify stakeholders'],
          next_nodes: ['scoping_phase']
        },
        scoping_phase: {
          id: 'scoping_phase',
          title: 'Scoping & Containment',
          description: 'Determine scope and contain the incident',
          actions: ['Isolate endpoints', 'Disable accounts', 'Block C2 communications'],
          next_nodes: ['investigation_phase']
        },
        investigation_phase: {
          id: 'investigation_phase',
          title: 'Investigation & Analysis',
          description: 'Forensic analysis and evidence collection',
          actions: ['Collect forensic images', 'Analyze malware', 'Timeline reconstruction'],
          next_nodes: ['remediation_phase']
        },
        remediation_phase: {
          id: 'remediation_phase',
          title: 'Remediation & Recovery',
          description: 'System recovery and remediation',
          actions: ['Restore from backups', 'Patch vulnerabilities', 'Update security controls'],
          next_nodes: ['post_incident_phase']
        },
        post_incident_phase: {
          id: 'post_incident_phase',
          title: 'Post-Incident Activities',
          description: 'Lessons learned and improvement',
          actions: ['Document lessons learned', 'Update procedures', 'Conduct training'],
          next_nodes: []
        }
      }
    }
  }
}

// MSW server setup for integration tests
const server = setupServer(
  // Alerts API
  http.get('/api/alerts', () => {
    return HttpResponse.json(mockIncidentData.alerts)
  }),

  http.get('/api/alerts/:id', ({ params }) => {
    const alert = mockIncidentData.alerts.find(a => a.id === params.id)
    return alert ? HttpResponse.json(alert) : new HttpResponse(null, { status: 404 })
  }),

  // Endpoints API
  http.get('/api/endpoints', () => {
    return HttpResponse.json(mockIncidentData.endpoints)
  }),

  // Logs API
  http.get('/api/logs', ({ request }) => {
    const url = new URL(request.url)
    const severity = url.searchParams.get('severity')
    const source = url.searchParams.get('source')

    let filteredLogs = mockIncidentData.logs
    if (severity && severity !== 'All Severities') {
      filteredLogs = filteredLogs.filter(log => log.severity === severity)
    }
    if (source && source !== 'All Sources') {
      filteredLogs = filteredLogs.filter(log => log.source === source)
    }

    return HttpResponse.json(filteredLogs)
  }),

  // Workflow Sessions API
  http.get('/api/workflow-sessions', () => {
    return HttpResponse.json(mockIncidentData.workflowSessions)
  }),

  http.post('/api/workflow-sessions', async ({ request }) => {
    const body = await request.json() as any
    const newSession = {
      id: `session-${Date.now()}`,
      ...body,
      started_at: body.started_at || new Date().toISOString(),
      completed_nodes: body.completed_nodes || [],
      actions_taken: body.actions_taken || [],
      status: body.status || 'Active'
    }
    return HttpResponse.json(newSession, { status: 201 })
  }),

  http.put('/api/workflow-sessions/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const updatedSession = {
      ...mockIncidentData.workflowSessions[0],
      id: params.id as string,
      ...body
    }
    return HttpResponse.json(updatedSession)
  }),

  // Playbooks API
  http.get('/api/playbooks/:type', ({ params }) => {
    const playbook = mockIncidentData.playbooks[params.type as keyof typeof mockIncidentData.playbooks]
    return playbook ? HttpResponse.json(playbook) : new HttpResponse(null, { status: 404 })
  }),

  // Actions API
  http.post('/api/actions/isolate-endpoint', async ({ request }) => {
    const body = await request.json() as { endpointId: string }
    return HttpResponse.json({
      success: true,
      message: `Endpoint ${body.endpointId} isolated successfully`,
      timestamp: new Date().toISOString()
    })
  }),

  http.post('/api/actions/disable-account', async ({ request }) => {
    const body = await request.json() as { userId: string }
    return HttpResponse.json({
      success: true,
      message: `User account ${body.userId} disabled successfully`,
      timestamp: new Date().toISOString()
    })
  }),

  // Reports API
  http.post('/api/reports/generate', async ({ request }) => {
    const body = await request.json() as { sessionId: string, format: string }
    return HttpResponse.json({
      success: true,
      reportId: `report-${Date.now()}`,
      format: body.format,
      downloadUrl: `/api/reports/download/report-${Date.now()}.${body.format}`,
      generatedAt: new Date().toISOString()
    })
  }),

  // Authentication
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { role: string }
    return HttpResponse.json({
      success: true,
      user: {
        id: `user-${Date.now()}`,
        role: body.role,
        username: `${body.role.toLowerCase()}_user`
      },
      token: 'mock-jwt-token'
    })
  })
)

describe('Incident Response Workflow Integration Tests', () => {
  let queryClient: QueryClient

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    server.resetHandlers()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Analyst Role - Complete Incident Response Flow', () => {
    it('should complete full ransomware incident response workflow', async () => {
      const user = userEvent.setup()

      // Mock the auth and workflow hooks for this test
      const mockAuth = {
        login: vi.fn().mockResolvedValue({ success: true }),
        isLoading: false,
        user: { role: 'Analyst' }
      }

      const mockWorkflow = {
        currentNode: 'detection_phase',
        workflow: mockIncidentData.workflowSessions[0],
        advanceWorkflow: vi.fn(),
        playbook: mockIncidentData.playbooks.ransomware
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))
      vi.doMock('@/hooks/use-workflow', () => ({ useWorkflow: () => mockWorkflow }))

      // Step 1: Login as Analyst
      const { unmount: unmountLogin } = render(<LoginPage />)

      await user.click(screen.getByTestId('role-analyst'))
      await user.click(screen.getByTestId('login-button'))

      await waitFor(() => {
        expect(mockAuth.login).toHaveBeenCalledWith('Analyst')
      })

      unmountLogin()

      // Step 2: Access Dashboard and see critical alerts
      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Ransomware Activity Detected')).toBeInTheDocument()
      })

      // Verify alert is marked as critical and selected
      expect(screen.getByText('CRITICAL')).toBeInTheDocument()
      expect(screen.getByText('3 endpoints affected')).toBeInTheDocument()

      // Step 3: Start investigation workflow
      const startInvestigationBtn = screen.getByTestId('start-investigation')
      await user.click(startInvestigationBtn)

      // Verify workflow tracker shows current phase
      await waitFor(() => {
        expect(screen.getByTestId('current-phase')).toHaveTextContent('Detection')
      })

      // Step 4: Progress through workflow phases
      // Move to Scoping phase
      const scopingPhaseBtn = screen.getByTestId('phase-click-btn')
      await user.click(scopingPhaseBtn)

      expect(mockWorkflow.advanceWorkflow).toHaveBeenCalledWith(
        'investigation_phase',
        'Advanced to Investigation phase'
      )

      // Step 5: Verify MITRE ATT&CK mapping is displayed
      expect(screen.getByTestId('mitre-techniques')).toHaveTextContent('T1486')

      // Step 6: Check endpoint status and isolation
      expect(screen.getByText('WS-001')).toBeInTheDocument()
      expect(screen.getByText('WS-002')).toBeInTheDocument()

      // Step 7: Verify log analysis capabilities
      expect(screen.getByText('Ransomware encryption process detected')).toBeInTheDocument()
      expect(screen.getByText('Suspicious outbound connection to known C2 server')).toBeInTheDocument()
    })

    it('should handle containment actions during scoping phase', async () => {
      const user = userEvent.setup()

      // Mock containment action API calls
      server.use(
        http.post('/api/actions/isolate-endpoint', async ({ request }) => {
          const body = await request.json() as { endpointId: string }
          return HttpResponse.json({
            success: true,
            message: `Endpoint ${body.endpointId} isolated successfully`
          })
        })
      )

      const mockAuth = {
        user: { role: 'Analyst' },
        isLoading: false
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Ransomware Activity Detected')).toBeInTheDocument()
      })

      // Simulate isolation action on infected endpoint
      const isolateBtn = screen.getByTestId('isolate-endpoint-btn')
      await user.click(isolateBtn)

      // Verify API call was made
      await waitFor(() => {
        expect(screen.getByText(/isolated successfully/)).toBeInTheDocument()
      })
    })
  })

  describe('Manager Role - Oversight and Business Impact', () => {
    it('should display business impact metrics and high-level status', async () => {
      const mockAuth = {
        user: { role: 'Manager' },
        isLoading: false
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('business-impact')).toBeInTheDocument()
      })

      // Verify manager sees business impact information
      expect(screen.getByText(/Business Impact:/)).toBeInTheDocument()

      // Verify manager doesn't see detailed technical controls
      expect(screen.queryByTestId('start-investigation-btn')).not.toBeInTheDocument()
    })

    it('should allow managers to generate incident reports', async () => {
      const user = userEvent.setup()

      const mockAuth = {
        user: { role: 'Manager' },
        isLoading: false
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('report-generator')).toBeInTheDocument()
      })

      // Generate PDF report
      const generateReportBtn = screen.getByTestId('generate-pdf-report')
      await user.click(generateReportBtn)

      await waitFor(() => {
        expect(screen.getByText(/Report generated successfully/)).toBeInTheDocument()
      })
    })
  })

  describe('Client Role - High-Level Communication', () => {
    it('should show client-appropriate incident information', async () => {
      const mockAuth = {
        user: { role: 'Client' },
        isLoading: false
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/A security incident has been detected/)).toBeInTheDocument()
      })

      // Verify client sees simplified information
      expect(screen.getByTestId('get-updates-btn')).toBeInTheDocument()

      // Verify client doesn't see technical details
      expect(screen.queryByTestId('start-investigation-btn')).not.toBeInTheDocument()
      expect(screen.queryByText('Ransomware encryption process detected')).not.toBeInTheDocument()
    })

    it('should allow clients to request status updates', async () => {
      const user = userEvent.setup()

      const mockAuth = {
        user: { role: 'Client' },
        isLoading: false
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('get-updates-btn')).toBeInTheDocument()
      })

      const getUpdatesBtn = screen.getByTestId('get-updates-btn')
      await user.click(getUpdatesBtn)

      // Verify update request was processed
      await waitFor(() => {
        expect(screen.getByText(/You will receive email updates/)).toBeInTheDocument()
      })
    })
  })

  describe('AI Assistant Integration Across Roles', () => {
    it('should provide role-appropriate AI assistance', async () => {
      const mockAuth = {
        user: { role: 'Analyst' },
        isLoading: false
      }

      vi.doMock('@/hooks/use-auth', () => ({ useAuth: () => mockAuth }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('ai-assistant')).toBeInTheDocument()
      })

      // Verify AI assistant shows current alert context
      expect(screen.getByTestId('current-alert')).toHaveTextContent('alert-ransomware-001')

      // Verify AI assistant adapts to user role
      expect(screen.getByTestId('user-role')).toHaveTextContent('Analyst')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle API failures gracefully', async () => {
      // Simulate API failure
      server.use(
        http.get('/api/alerts', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      // Should still render loading state and handle error gracefully
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should handle missing workflow session data', async () => {
      server.use(
        http.get('/api/workflow-sessions', () => {
          return HttpResponse.json([])
        })
      )

      const mockWorkflow = {
        currentNode: null,
        workflow: null,
        advanceWorkflow: vi.fn(),
        playbook: null
      }

      vi.doMock('@/hooks/use-workflow', () => ({ useWorkflow: () => mockWorkflow }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-alert')).toHaveTextContent('no-alert')
      })
    })

    it('should handle role mismatches and unauthorized access', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return new HttpResponse(null, { status: 401 })
        })
      )

      const user = userEvent.setup()

      render(<LoginPage />)

      await user.click(screen.getByTestId('role-analyst'))
      await user.click(screen.getByTestId('login-button'))

      // Should show error toast for unauthorized access
      await waitFor(() => {
        expect(screen.getByText(/Unable to authenticate/)).toBeInTheDocument()
      })
    })
  })

  describe('Multi-Phase Workflow Progression', () => {
    it('should track progress through all incident response phases', async () => {
      const mockWorkflow = {
        currentNode: 'remediation_phase',
        workflow: {
          ...mockIncidentData.workflowSessions[0],
          current_node: 'remediation_phase',
          completed_nodes: ['detection_phase', 'scoping_phase', 'investigation_phase']
        },
        advanceWorkflow: vi.fn(),
        playbook: mockIncidentData.playbooks.ransomware
      }

      vi.doMock('@/hooks/use-workflow', () => ({ useWorkflow: () => mockWorkflow }))

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-phase')).toHaveTextContent('Remediation')
      })

      // Verify completed phases are shown
      const completedPhases = screen.getByTestId('completed-phases')
      expect(completedPhases).toHaveTextContent('Detection, Scoping, Investigation')
    })
  })
})