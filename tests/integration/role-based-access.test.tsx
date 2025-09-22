import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import App from '@/App';

// Mock API responses
const mockApiResponses = {
  alerts: [
    {
      id: 'alert-001',
      title: 'Ransomware Detection',
      severity: 'Critical',
      status: 'New',
      timestamp: '2025-01-17T10:00:00Z',
      description: 'Ransomware activity detected',
      source: 'EDR',
      affected_endpoints: ['endpoint-01', 'endpoint-02'],
      mitre_tactics: ['T1486'],
      recommended_actions: ['Isolate endpoints']
    }
  ],
  endpoints: [
    {
      id: 'endpoint-01',
      hostname: 'WS-001',
      ip_address: '192.168.1.100',
      os: 'Windows 10',
      department: 'Finance',
      status: 'Affected',
      risk_score: 8
    }
  ],
  logs: [
    {
      id: 'log-001',
      timestamp: '2025-01-17T10:00:00Z',
      source: 'Windows Event Log',
      severity: 'High',
      message: 'Suspicious process execution',
      endpoint_id: 'endpoint-01'
    }
  ]
};

global.fetch = vi.fn();

const renderWithProviders = (component: React.ReactElement, initialPath = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Router>
        {component}
      </Router>
    </QueryClientProvider>
  );
};

describe('Role-Based Access Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default API mock responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/alerts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.alerts)
        });
      }
      if (url.includes('/api/endpoints')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.endpoints)
        });
      }
      if (url.includes('/api/logs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses.logs)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Analyst Role Access', () => {
    it('should have full access to technical features', async () => {
      // Set user role to Analyst
      const mockUser = { role: 'Analyst', name: 'John Analyst' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        // Should see technical dashboard elements
        expect(screen.getByText(/Security Operations Dashboard/i)).toBeInTheDocument();
      });

      // Should have access to technical actions
      expect(screen.getByText(/Isolate Endpoint/i)).toBeInTheDocument();
      expect(screen.getByText(/Lock Account/i)).toBeInTheDocument();
      expect(screen.getByText(/Collect Logs/i)).toBeInTheDocument();

      // Should see detailed log information
      expect(screen.getByText(/Event Logs/i)).toBeInTheDocument();
      expect(screen.getByText(/Network Logs/i)).toBeInTheDocument();

      // Should have access to AI Assistant with technical suggestions
      expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/What IOCs should I look for?/i)).toBeInTheDocument();
    });

    it('should allow technical workflow steps', async () => {
      const mockUser = { role: 'Analyst', name: 'John Analyst' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Detection/i)).toBeInTheDocument();
        expect(screen.getByText(/Scoping/i)).toBeInTheDocument();
        expect(screen.getByText(/Containment/i)).toBeInTheDocument();
        expect(screen.getByText(/Eradication/i)).toBeInTheDocument();
        expect(screen.getByText(/Recovery/i)).toBeInTheDocument();
      });
    });

    it('should have access to MITRE ATT&CK information', async () => {
      const mockUser = { role: 'Analyst', name: 'John Analyst' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/T1486/i)).toBeInTheDocument();
        expect(screen.getByText(/MITRE/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manager Role Access', () => {
    it('should have access to executive features only', async () => {
      const mockUser = { role: 'Manager', name: 'Jane Manager' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        // Should see high-level dashboard
        expect(screen.getByText(/Executive Dashboard/i)).toBeInTheDocument();
      });

      // Should have access to business impact metrics
      expect(screen.getByText(/Business Impact/i)).toBeInTheDocument();
      expect(screen.getByText(/Financial Impact/i)).toBeInTheDocument();
      expect(screen.getByText(/Operational Impact/i)).toBeInTheDocument();

      // Should NOT have access to technical actions
      expect(screen.queryByText(/Isolate Endpoint/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Collect Logs/i)).not.toBeInTheDocument();

      // Should have AI Assistant with executive-focused suggestions
      expect(screen.getByText(/Impact Assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/Communication Plan/i)).toBeInTheDocument();
    });

    it('should see simplified workflow view', async () => {
      const mockUser = { role: 'Manager', name: 'Jane Manager' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        // Should see high-level phases only
        expect(screen.getByText(/Investigation/i)).toBeInTheDocument();
        expect(screen.getByText(/Response/i)).toBeInTheDocument();
        expect(screen.getByText(/Recovery/i)).toBeInTheDocument();
      });

      // Should NOT see detailed technical steps
      expect(screen.queryByText(/Malware Analysis/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Forensic Collection/i)).not.toBeInTheDocument();
    });

    it('should generate executive reports', async () => {
      const mockUser = { role: 'Manager', name: 'Jane Manager' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      const user = userEvent.setup();
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Generate Report/i)).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: expect.any(String),
          format: 'pdf',
          userRole: 'Manager'
        })
      });
    });
  });

  describe('Client Role Access', () => {
    it('should have limited view with status information only', async () => {
      const mockUser = { role: 'Client', name: 'Alex Client' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        // Should see client-focused dashboard
        expect(screen.getByText(/Security Status/i)).toBeInTheDocument();
      });

      // Should only see basic status information
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Affected Systems/i)).toBeInTheDocument();

      // Should NOT have access to technical details
      expect(screen.queryByText(/Event Logs/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/MITRE/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Isolate/i)).not.toBeInTheDocument();

      // Should have simple AI Assistant
      expect(screen.getByText(/What happened?/i)).toBeInTheDocument();
      expect(screen.getByText(/When will this be resolved?/i)).toBeInTheDocument();
    });

    it('should see client-appropriate workflow information', async () => {
      const mockUser = { role: 'Client', name: 'Alex Client' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        // Should see very simplified status
        expect(screen.getByText(/Incident Status/i)).toBeInTheDocument();
        expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
      });

      // Should NOT see technical workflow steps
      expect(screen.queryByText(/Malware Analysis/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Forensics/i)).not.toBeInTheDocument();
    });
  });

  describe('Cross-Role API Access Control', () => {
    it('should restrict endpoint actions for non-Analyst roles', async () => {
      const mockUser = { role: 'Manager', name: 'Jane Manager' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      const user = userEvent.setup();
      renderWithProviders(<App />);

      // Try to access endpoint isolation (should be prevented)
      await waitFor(() => {
        expect(screen.queryByText(/Isolate Endpoint/i)).not.toBeInTheDocument();
      });

      // If somehow accessed, API should reject
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ error: 'Forbidden: Insufficient permissions' })
        })
      );
    });

    it('should provide role-filtered data', async () => {
      const mockUser = { role: 'Client', name: 'Alex Client' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        // Should call API with role parameter
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/alerts'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-User-Role': 'Client'
            })
          })
        );
      });
    });
  });

  describe('Role Switching Scenarios', () => {
    it('should update UI when user role changes', async () => {
      let mockUser = { role: 'Client', name: 'Alex Client' };
      const mockLocalStorage = {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      vi.stubGlobal('localStorage', mockLocalStorage);

      const { rerender } = renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Security Status/i)).toBeInTheDocument();
      });

      // Simulate role change to Analyst
      mockUser = { role: 'Analyst', name: 'Alex Analyst' };
      rerender(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Security Operations Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/Isolate Endpoint/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling with Roles', () => {
    it('should handle authentication errors appropriately', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' })
        })
      );

      const mockUser = { role: 'Analyst', name: 'John Analyst' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Please log in to continue/i)).toBeInTheDocument();
      });
    });

    it('should handle forbidden access gracefully', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ error: 'Forbidden' })
        })
      );

      const mockUser = { role: 'Client', name: 'Alex Client' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => key === 'user' ? JSON.stringify(mockUser) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Access denied/i)).toBeInTheDocument();
      });
    });
  });
});