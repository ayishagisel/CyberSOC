import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportGenerator } from '@/components/ReportGenerator';
import { useToast } from '@/hooks/use-toast';

vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();
const mockUseToast = useToast as any;

global.fetch = vi.fn();

describe('ReportGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        reportId: 'report-123'
      })
    });
  });

  describe('Basic Rendering', () => {
    it('renders report generator with format options', () => {
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      expect(screen.getByText('Generate Report')).toBeInTheDocument();
      expect(screen.getByLabelText(/PDF Report/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/JSON Export/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Text Summary/i)).toBeInTheDocument();
    });

    it('shows role-specific information', () => {
      render(<ReportGenerator sessionId="session-001" userRole="Manager" />);

      expect(screen.getByText(/executive summary/i)).toBeInTheDocument();
    });

    it('displays different options for Client role', () => {
      render(<ReportGenerator sessionId="session-001" userRole="Client" />);

      expect(screen.getByText(/status report/i)).toBeInTheDocument();
      expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();
    });
  });

  describe('Format Selection', () => {
    it('allows selecting PDF format', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const pdfOption = screen.getByLabelText(/PDF Report/i);
      await user.click(pdfOption);

      expect(pdfOption).toBeChecked();
    });

    it('allows selecting JSON format', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const jsonOption = screen.getByLabelText(/JSON Export/i);
      await user.click(jsonOption);

      expect(jsonOption).toBeChecked();
    });

    it('allows selecting Text format', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const textOption = screen.getByLabelText(/Text Summary/i);
      await user.click(textOption);

      expect(textOption).toBeChecked();
    });

    it('defaults to PDF format', () => {
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const pdfOption = screen.getByLabelText(/PDF Report/i);
      expect(pdfOption).toBeChecked();
    });
  });

  describe('Report Generation', () => {
    it('generates report when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session-001',
          format: 'pdf',
          userRole: 'Analyst'
        })
      });
    });

    it('generates report with selected format', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const jsonOption = screen.getByLabelText(/JSON Export/i);
      await user.click(jsonOption);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session-001',
          format: 'json',
          userRole: 'Analyst'
        })
      });
    });

    it('shows loading state during generation', async () => {
      (global.fetch as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, reportId: 'report-123' })
        }), 100))
      );

      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });

    it('shows success message after successful generation', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Report generated successfully',
          variant: 'default'
        });
      });
    });
  });

  describe('File Download', () => {
    it('handles PDF download', async () => {
      const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      });

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      });

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('handles JSON download', async () => {
      const mockReportData = { id: 'report-123', summary: 'Test report' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReportData)
      });

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');

      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const jsonOption = screen.getByLabelText(/JSON Export/i);
      await user.click(jsonOption);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(createObjectURLSpy).toHaveBeenCalled();
      });

      createObjectURLSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when generation fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Server error'));

      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to generate report. Please try again.',
          variant: 'destructive'
        });
      });
    });

    it('handles server errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to generate report. Please try again.',
          variant: 'destructive'
        });
      });
    });

    it('re-enables button after error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Server error'));

      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });
  });

  describe('Role-based Features', () => {
    it('includes technical details for Analyst reports', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      expect(screen.getByText(/technical analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/detailed logs/i)).toBeInTheDocument();
    });

    it('focuses on business impact for Manager reports', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Manager" />);

      expect(screen.getByText(/executive summary/i)).toBeInTheDocument();
      expect(screen.getByText(/business impact/i)).toBeInTheDocument();
    });

    it('provides simplified content for Client reports', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator sessionId="session-001" userRole="Client" />);

      expect(screen.getByText(/status report/i)).toBeInTheDocument();
      expect(screen.queryByText(/technical/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      expect(screen.getByLabelText(/report format/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate report/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<ReportGenerator sessionId="session-001" userRole="Analyst" />);

      const pdfOption = screen.getByLabelText(/PDF Report/i);
      const jsonOption = screen.getByLabelText(/JSON Export/i);
      const textOption = screen.getByLabelText(/Text Summary/i);

      expect(pdfOption).toHaveAttribute('type', 'radio');
      expect(jsonOption).toHaveAttribute('type', 'radio');
      expect(textOption).toHaveAttribute('type', 'radio');
    });
  });

  describe('Session Validation', () => {
    it('disables generation without valid session', () => {
      render(<ReportGenerator sessionId="" userRole="Analyst" />);

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      expect(generateButton).toBeDisabled();
    });

    it('shows message when no session is available', () => {
      render(<ReportGenerator sessionId="" userRole="Analyst" />);

      expect(screen.getByText(/no active session/i)).toBeInTheDocument();
    });
  });
});