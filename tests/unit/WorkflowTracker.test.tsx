import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowTracker from '@/components/WorkflowTracker';
import { useWorkflow } from '@/hooks/use-workflow';

vi.mock('@/hooks/use-workflow');

const mockUseWorkflow = useWorkflow as any;

describe('WorkflowTracker', () => {
  const mockCurrentStep = 2;
  const mockTotalSteps = 5;
  const mockStepHistory = [
    { step: 1, title: 'Detection', completed: true, timestamp: '2025-01-17T10:00:00Z' },
    { step: 2, title: 'Scoping', completed: true, timestamp: '2025-01-17T10:15:00Z' },
    { step: 3, title: 'Containment', completed: false, timestamp: null }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkflow.mockReturnValue({
      currentStep: mockCurrentStep,
      totalSteps: mockTotalSteps,
      stepHistory: mockStepHistory,
      isLoading: false
    });
  });

  describe('Basic Rendering', () => {
    it('renders workflow tracker with step information', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText('Incident Response Progress')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    });

    it('renders all workflow steps', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText('Detection')).toBeInTheDocument();
      expect(screen.getByText('Scoping')).toBeInTheDocument();
      expect(screen.getByText('Containment')).toBeInTheDocument();
    });

    it('shows completed steps with checkmarks', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const detectionStep = screen.getByText('Detection').closest('.workflow-step');
      const scopingStep = screen.getByText('Scoping').closest('.workflow-step');

      expect(detectionStep).toHaveClass('completed');
      expect(scopingStep).toHaveClass('completed');
    });

    it('shows current step as active', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const containmentStep = screen.getByText('Containment').closest('.workflow-step');
      expect(containmentStep).toHaveClass('active');
    });
  });

  describe('Progress Bar', () => {
    it('displays correct progress percentage', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '40'); // 2/5 = 40%
    });

    it('updates progress bar when step changes', () => {
      mockUseWorkflow.mockReturnValue({
        currentStep: 4,
        totalSteps: 5,
        stepHistory: mockStepHistory,
        isLoading: false
      });

      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '80'); // 4/5 = 80%
    });
  });

  describe('Role-based Display', () => {
    it('shows detailed technical steps for Analyst role', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText(/technical analysis/i)).toBeInTheDocument();
    });

    it('shows high-level overview for Manager role', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Manager" />);

      expect(screen.getByText(/status overview/i)).toBeInTheDocument();
      expect(screen.queryByText(/technical analysis/i)).not.toBeInTheDocument();
    });

    it('shows simplified view for Client role', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Client" />);

      expect(screen.getByText(/incident status/i)).toBeInTheDocument();
      expect(screen.queryByText(/technical/i)).not.toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('displays completion timestamps for finished steps', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText(/10:00/)).toBeInTheDocument();
      expect(screen.getByText(/10:15/)).toBeInTheDocument();
    });

    it('does not show timestamps for incomplete steps', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const containmentStep = screen.getByText('Containment').closest('.workflow-step');
      expect(containmentStep).not.toContainHTML('timestamp');
    });
  });

  describe('Loading State', () => {
    it('shows loading state when workflow data is loading', () => {
      mockUseWorkflow.mockReturnValue({
        currentStep: 0,
        totalSteps: 0,
        stepHistory: [],
        isLoading: true
      });

      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing alert ID gracefully', () => {
      mockUseWorkflow.mockReturnValue({
        currentStep: 0,
        totalSteps: 0,
        stepHistory: [],
        isLoading: false,
        error: 'Alert not found'
      });

      render(<WorkflowTracker alertId="" userRole="Analyst" />);

      expect(screen.getByText(/no active workflow/i)).toBeInTheDocument();
    });

    it('handles workflow errors gracefully', () => {
      mockUseWorkflow.mockReturnValue({
        currentStep: 0,
        totalSteps: 0,
        stepHistory: [],
        isLoading: false,
        error: 'Failed to load workflow'
      });

      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText(/error loading workflow/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('allows clicking on completed steps to view details', () => {
      const mockOnStepClick = vi.fn();
      mockUseWorkflow.mockReturnValue({
        ...mockUseWorkflow(),
        onStepClick: mockOnStepClick
      });

      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const detectionStep = screen.getByText('Detection');
      fireEvent.click(detectionStep);

      expect(mockOnStepClick).toHaveBeenCalledWith(1);
    });

    it('prevents clicking on future steps', () => {
      const mockOnStepClick = vi.fn();

      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const futureStep = screen.getByText('Containment');
      fireEvent.click(futureStep);

      expect(mockOnStepClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Workflow Progress');
      expect(screen.getByLabelText(/current step/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<WorkflowTracker alertId="alert-001" userRole="Analyst" />);

      const firstStep = screen.getByText('Detection');
      expect(firstStep).toHaveAttribute('tabindex', '0');
    });
  });
});