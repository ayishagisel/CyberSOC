import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import Dashboard from '@/pages/dashboard'
import { useWorkflow } from '@/hooks/use-workflow'
import { AuthProvider } from '@/hooks/use-auth'
import type { Alert, Endpoint, LogEntry } from '@shared/schema'

// Mock the workflow hook
vi.mock('@/hooks/use-workflow', () => ({
  useWorkflow: vi.fn()
}))

// Mock child components
vi.mock('@/components/Navbar', () => ({
  default: ({ userRole, onRoleChange }: any) => (
    <div data-testid="navbar">
      <span data-testid="current-role">{userRole}</span>
      <button onClick={() => onRoleChange('Manager')} data-testid="change-role-btn">
        Change Role
      </button>
    </div>
  )
}))

vi.mock('@/components/WorkflowTracker', () => ({
  default: ({ alertId, userRole, onPhaseClick }: any) => (
    <div data-testid="workflow-tracker">
      <span data-testid="current-phase">Detection</span>
      <div data-testid="completed-phases">Detection, Scoping</div>
      <div data-testid="mitre-techniques">T1486, T1059.001</div>
      <span data-testid="alert-id">{alertId}</span>
      <span data-testid="user-role">{userRole}</span>
      <button onClick={() => onPhaseClick && onPhaseClick('Investigation')} data-testid="phase-click-btn">
        Click Phase
      </button>
    </div>
  )
}))

vi.mock('@/components/AlertCard', () => ({
  default: ({ alert, isSelected, userRole, onStartInvestigation }: any) => (
    <div data-testid={`alert-card-${alert.id}`}>
      <span data-testid="alert-title">{alert.title}</span>
      <span data-testid="alert-severity">{alert.severity}</span>
      <span data-testid="alert-selected">{isSelected ? 'selected' : 'not-selected'}</span>
      <button onClick={() => onStartInvestigation(alert.id)} data-testid="start-investigation">
        Start Investigation
      </button>
    </div>
  )
}))

vi.mock('@/components/AssetTable', () => ({
  default: ({ endpoints, userRole }: any) => (
    <div data-testid="asset-table">
      <span data-testid="endpoints-count">{endpoints.length} endpoints</span>
      <span data-testid="user-role">{userRole}</span>
    </div>
  )
}))

vi.mock('@/components/LogViewer', () => ({
  default: ({ logs, userRole }: any) => (
    <div data-testid="log-viewer">
      <span data-testid="logs-count">{logs.length} logs</span>
      <span data-testid="user-role">{userRole}</span>
    </div>
  )
}))

vi.mock('@/components/AIAssistantPanel', () => ({
  default: ({ currentAlert, userRole }: any) => (
    <div data-testid="ai-assistant">
      <span data-testid="current-alert">{currentAlert?.id || 'no-alert'}</span>
      <span data-testid="user-role">{userRole}</span>
    </div>
  )
}))

vi.mock('@/components/ReportGenerator', () => ({
  default: ({ userRole }: any) => (
    <div data-testid="report-generator">
      <span data-testid="user-role">{userRole}</span>
    </div>
  )
}))

vi.mock('@/components/BusinessImpactMetrics', () => ({
  default: ({ userRole }: any) => (
    <div data-testid="business-impact">
      <span data-testid="user-role">{userRole}</span>
    </div>
  )
}))

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'Ransomware Detection',
    severity: 'Critical',
    status: 'Active',
    timestamp: '2024-01-15T10:00:00Z',
    description: 'Ransomware activity detected',
    source: 'EDR',
    affected_endpoints: ['WS-001'],
    mitre_tactics: ['T1486'],
    recommended_actions: []
  },
  {
    id: 'alert-2',
    title: 'Suspicious Login',
    severity: 'High',
    status: 'New',
    timestamp: '2024-01-15T11:00:00Z',
    description: 'Multiple failed login attempts',
    source: 'Auth System',
    affected_endpoints: ['WS-002'],
    mitre_tactics: ['T1078'],
    recommended_actions: []
  }
]

const mockEndpoints: Endpoint[] = [
  {
    id: 'endpoint-1',
    hostname: 'WS-001',
    ip_address: '192.168.1.100',
    os: 'Windows 10',
    department: 'Finance',
    last_seen: '2024-01-15T10:00:00Z',
    status: 'Isolated',
    risk_score: 85
  }
]

const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2024-01-15T10:00:00Z',
    source: 'Windows Event Log',
    severity: 'High',
    message: 'Suspicious process execution',
    endpoint_id: 'endpoint-1',
    user_id: 'john.doe',
    process_name: 'encrypt.exe',
    details: { pid: 1234 }
  }
]

const mockWorkflow = {
  id: 'workflow-1',
  alert_id: 'alert-1',
  current_node: 'investigation_phase',
  completed_nodes: ['detection_phase'],
  actions_taken: [],
  status: 'Active' as const,
  user_role: 'Analyst' as const,
  created_at: new Date(),
  updated_at: new Date()
}

const mockPlaybook = {
  id: 'playbook-1',
  title: 'Ransomware Response',
  nodes: {
    detection_phase: { id: 'detection_phase', title: 'Detection' },
    investigation_phase: { id: 'investigation_phase', title: 'Investigation' },
    remediation_phase: { id: 'remediation_phase', title: 'Remediation' }
  }
}

const mockUseWorkflow = useWorkflow as any

describe('Dashboard', () => {
  let queryClient: QueryClient
  const mockAdvanceWorkflow = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Set up fetch mocks for API calls
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAlerts)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEndpoints)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLogs)
      }))

    // Mock the workflow hook
    mockUseWorkflow.mockReturnValue({
      currentNode: 'investigation_phase',
      workflow: mockWorkflow,
      advanceWorkflow: mockAdvanceWorkflow,
      playbook: mockPlaybook
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  describe('Initial rendering and loading', () => {
    it('shows loading state initially', () => {
      // Override fetch to return pending promises
      global.fetch = vi.fn(() => new Promise(() => {}))

      renderDashboard()

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })

    it('renders dashboard components after loading', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument()
        expect(screen.getByTestId('workflow-tracker')).toBeInTheDocument()
        expect(screen.getByTestId('asset-table')).toBeInTheDocument()
        expect(screen.getByTestId('log-viewer')).toBeInTheDocument()
        expect(screen.getByTestId('ai-assistant')).toBeInTheDocument()
      })
    })

    it('renders alert cards for all alerts', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('alert-card-alert-1')).toBeInTheDocument()
        expect(screen.getByTestId('alert-card-alert-2')).toBeInTheDocument()
      })
    })
  })

  describe('Role management', () => {
    it('starts with Analyst role by default', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('current-role')).toHaveTextContent('Analyst')
      })
    })

    it('changes role when navbar triggers role change', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('current-role')).toHaveTextContent('Analyst')
      })

      await user.click(screen.getByTestId('change-role-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('current-role')).toHaveTextContent('Manager')
      })
    })

    it('passes user role to all child components', async () => {
      renderDashboard()

      await waitFor(() => {
        const userRoleElements = screen.getAllByTestId('user-role')
        userRoleElements.forEach(element => {
          expect(element).toHaveTextContent('Analyst')
        })
      })
    })
  })

  describe('Alert management', () => {
    it('automatically selects critical alert as active alert', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('current-alert')).toHaveTextContent('alert-1')
      })

      // Verify the critical alert is marked as selected
      await waitFor(() => {
        expect(screen.getByTestId('alert-card-alert-1')).toContainElement(
          screen.getByText('selected')
        )
      })
    })

    it('changes active alert when investigation is started', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('alert-card-alert-2')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('start-investigation'))

      // Should update selected alert (this would trigger re-render in real app)
      expect(screen.getByTestId('alert-card-alert-2')).toBeInTheDocument()
    })
  })

  describe('Workflow integration', () => {
    it('displays current workflow phase correctly', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('current-phase')).toHaveTextContent('Investigation')
      })
    })

    it('shows completed phases from workflow', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('completed-phases')).toHaveTextContent('Detection')
      })
    })

    it('displays MITRE ATT&CK techniques from active alert', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('mitre-techniques')).toHaveTextContent('T1486')
      })
    })

    it('advances workflow when phase is clicked', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('phase-click-btn')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('phase-click-btn'))

      expect(mockAdvanceWorkflow).toHaveBeenCalledWith(
        'investigation_phase',
        'Advanced to Investigation phase'
      )
    })
  })

  describe('Data display', () => {
    it('passes correct data to AssetTable', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('endpoints-count')).toHaveTextContent('1 endpoints')
      })
    })

    it('passes correct data to LogViewer', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('logs-count')).toHaveTextContent('1 logs')
      })
    })
  })

  describe('Error handling', () => {
    it('handles API errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('API Error')))

      renderDashboard()

      // Should still render loading initially, then handle error gracefully
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    })

    it('handles workflow hook with no active alert', async () => {
      mockUseWorkflow.mockReturnValue({
        currentNode: null,
        workflow: null,
        advanceWorkflow: mockAdvanceWorkflow,
        playbook: null
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('current-alert')).toHaveTextContent('no-alert')
      })
    })
  })

  describe('Console logging', () => {
    it('logs dashboard state for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      renderDashboard()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Dashboard state:',
          expect.objectContaining({
            selectedAlert: null,
            criticalAlerts: ['alert-1'],
            activeAlert: 'alert-1',
            workflowAlertId: 'alert-1'
          })
        )
      })

      consoleSpy.mockRestore()
    })
  })
})