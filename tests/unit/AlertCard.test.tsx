import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlertCard from '@/components/AlertCard'
import { useToast } from '@/hooks/use-toast'
import type { Alert } from '@shared/schema'

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}))

const mockToast = vi.fn()
const mockUseToast = useToast as any

describe('AlertCard', () => {
  const mockAlert: Alert = {
    id: 1,
    title: 'Suspicious Login Attempt',
    severity: 'High',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'Active',
    description: 'Multiple failed login attempts detected',
    source: 'auth-system',
    affected_endpoints: ['WS-001', 'WS-002', 'WS-003', 'WS-004'],
    mitre_tactics: ['Initial Access'],
    mitre_techniques: ['T1078 - Valid Accounts']
  }

  const mockOnStartInvestigation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseToast.mockReturnValue({ toast: mockToast })
  })

  describe('Rendering', () => {
    it('renders alert card with basic information', () => {
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByText('Suspicious Login Attempt')).toBeInTheDocument()
      expect(screen.getByText('HIGH')).toBeInTheDocument()
      expect(screen.getByText('4 endpoints affected')).toBeInTheDocument()
    })

    it('displays severity badge with correct styling', () => {
      const { rerender } = render(
        <AlertCard
          alert={{ ...mockAlert, severity: 'Critical' }}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByText('CRITICAL')).toHaveClass('bg-critical')

      rerender(
        <AlertCard
          alert={{ ...mockAlert, severity: 'Low' }}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByText('LOW')).toHaveClass('bg-success')
    })

    it('shows selection state when isSelected is true', () => {
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={true}
          userRole="Analyst"
        />
      )

      const alertCard = screen.getByTestId('alert-card')
      expect(alertCard).toHaveClass('ring-2', 'ring-primary')
    })

    it('formats timestamp correctly', () => {
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      const expectedDate = new Date('2024-01-15T10:30:00Z').toLocaleString()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  describe('Role-based rendering', () => {
    it('shows analyst-specific UI elements', () => {
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByTestId('start-investigation-btn')).toBeInTheDocument()
      expect(screen.getByTestId('view-details-btn')).toBeInTheDocument()
      expect(screen.getByTestId('assign-to-me-btn')).toBeInTheDocument()

      // Should show endpoint badges
      expect(screen.getByText('WS-001')).toBeInTheDocument()
      expect(screen.getByText('WS-002')).toBeInTheDocument()
      expect(screen.getByText('WS-003')).toBeInTheDocument()
      expect(screen.getByText('+1 more')).toBeInTheDocument()
    })

    it('shows manager-specific UI elements', () => {
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Manager"
        />
      )

      expect(screen.getByTestId('view-status-btn')).toBeInTheDocument()
      expect(screen.getByText(/Business Impact:/)).toBeInTheDocument()

      // Should not show analyst buttons
      expect(screen.queryByTestId('start-investigation-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('view-details-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('assign-to-me-btn')).not.toBeInTheDocument()
    })

    it('shows client-specific UI elements', () => {
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Client"
        />
      )

      expect(screen.getByTestId('get-updates-btn')).toBeInTheDocument()
      expect(screen.getByText(/A security incident has been detected/)).toBeInTheDocument()

      // Should not show analyst or manager buttons
      expect(screen.queryByTestId('start-investigation-btn')).not.toBeInTheDocument()
      expect(screen.queryByTestId('view-status-btn')).not.toBeInTheDocument()
    })
  })

  describe('User interactions', () => {
    it('calls onStartInvestigation when Start Investigation button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      await user.click(screen.getByTestId('start-investigation-btn'))
      expect(mockOnStartInvestigation).toHaveBeenCalledTimes(1)
    })

    it('shows toast when View Details button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      await user.click(screen.getByTestId('view-details-btn'))
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Alert Details',
        description: 'Viewing detailed information for: Suspicious Login Attempt'
      })
    })

    it('shows toast when Assign to Me button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      await user.click(screen.getByTestId('assign-to-me-btn'))
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Alert Assigned',
        description: 'Suspicious Login Attempt has been assigned to you.'
      })
    })

    it('shows toast when View Status button is clicked (Manager)', async () => {
      const user = userEvent.setup()
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Manager"
        />
      )

      await user.click(screen.getByTestId('view-status-btn'))
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Status Update',
        description: 'Incident response team is actively working on containment.'
      })
    })

    it('shows toast when Get Updates button is clicked (Client)', async () => {
      const user = userEvent.setup()
      render(
        <AlertCard
          alert={mockAlert}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Client"
        />
      )

      await user.click(screen.getByTestId('get-updates-btn'))
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Updates Requested',
        description: 'You will receive email updates on this incident\'s progress.'
      })
    })
  })

  describe('Edge cases', () => {
    it('handles empty affected endpoints array', () => {
      const alertWithNoEndpoints = { ...mockAlert, affected_endpoints: [] }
      render(
        <AlertCard
          alert={alertWithNoEndpoints}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByText('0 endpoints affected')).toBeInTheDocument()
    })

    it('handles alerts with less than 3 affected endpoints', () => {
      const alertWithTwoEndpoints = { ...mockAlert, affected_endpoints: ['WS-001', 'WS-002'] }
      render(
        <AlertCard
          alert={alertWithTwoEndpoints}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByText('WS-001')).toBeInTheDocument()
      expect(screen.getByText('WS-002')).toBeInTheDocument()
      expect(screen.queryByText('+1 more')).not.toBeInTheDocument()
    })

    it('handles unknown severity levels', () => {
      const alertWithUnknownSeverity = { ...mockAlert, severity: 'Unknown' as any }
      render(
        <AlertCard
          alert={alertWithUnknownSeverity}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      expect(screen.getByText('UNKNOWN')).toHaveClass('bg-muted')
    })

    it('handles invalid timestamp gracefully', () => {
      const alertWithInvalidTimestamp = { ...mockAlert, timestamp: 'invalid-date' }
      render(
        <AlertCard
          alert={alertWithInvalidTimestamp}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      // Should not crash and should render something
      expect(screen.getByTestId('alert-card')).toBeInTheDocument()
    })
  })

  describe('Critical severity styling', () => {
    it('applies critical background for Critical severity alerts', () => {
      render(
        <AlertCard
          alert={{ ...mockAlert, severity: 'Critical' }}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      const alertCard = screen.getByTestId('alert-card')
      expect(alertCard).toHaveClass('bg-critical')
    })

    it('does not apply critical background for non-Critical alerts', () => {
      render(
        <AlertCard
          alert={{ ...mockAlert, severity: 'High' }}
          onStartInvestigation={mockOnStartInvestigation}
          isSelected={false}
          userRole="Analyst"
        />
      )

      const alertCard = screen.getByTestId('alert-card')
      expect(alertCard).not.toHaveClass('bg-critical')
    })
  })
})