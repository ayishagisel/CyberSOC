import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';
import { useToast } from '@/hooks/use-toast';

vi.mock('@/hooks/use-toast');

const mockToast = vi.fn();
const mockUseToast = useToast as any;

// Mock fetch
global.fetch = vi.fn();

describe('AIAssistantPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: 'Based on the alert details, I recommend immediate containment of the affected endpoints.'
      })
    });
  });

  describe('Basic Rendering', () => {
    it('renders AI assistant panel with initial state', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ask me about this incident/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('shows role-appropriate welcome message', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Manager" />);

      expect(screen.getByText(/I can help you understand/i)).toBeInTheDocument();
    });

    it('displays different interface for Client role', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Client" />);

      expect(screen.getByText(/status updates/i)).toBeInTheDocument();
      expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();
    });
  });

  describe('Message Interaction', () => {
    it('sends message when form is submitted', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'What should I do first?');
      await user.click(sendButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What should I do first?',
          alertId: 'alert-001',
          userRole: 'Analyst'
        })
      });
    });

    it('sends message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);

      await user.type(input, 'How severe is this threat?');
      await user.keyboard('{Enter}');

      expect(global.fetch).toHaveBeenCalled();
    });

    it('does not send empty messages', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('clears input after sending message', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Message History', () => {
    it('displays user messages in chat history', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'What are the next steps?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('What are the next steps?')).toBeInTheDocument();
      });
    });

    it('displays AI responses in chat history', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'What should I do?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/immediate containment/i)).toBeInTheDocument();
      });
    });

    it('shows loading state while waiting for response', async () => {
      (global.fetch as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ response: 'Test response' })
        }), 100))
      );

      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    });
  });

  describe('Role-based Features', () => {
    it('shows technical suggestions for Analyst role', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText(/analyze the malware/i)).toBeInTheDocument();
      expect(screen.getByText(/check the logs/i)).toBeInTheDocument();
    });

    it('shows business-focused suggestions for Manager role', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Manager" />);

      expect(screen.getByText(/impact assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/communication plan/i)).toBeInTheDocument();
    });

    it('shows simple status queries for Client role', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Client" />);

      expect(screen.getByText(/what happened/i)).toBeInTheDocument();
      expect(screen.getByText(/when will this be resolved/i)).toBeInTheDocument();
    });
  });

  describe('Suggested Questions', () => {
    it('displays role-appropriate suggested questions', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText(/What IOCs should I look for?/i)).toBeInTheDocument();
      expect(screen.getByText(/How should I contain this?/i)).toBeInTheDocument();
    });

    it('allows clicking on suggested questions', async () => {
      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const suggestion = screen.getByText(/What IOCs should I look for?/i);
      await user.click(suggestion);

      expect(global.fetch).toHaveBeenCalledWith('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What IOCs should I look for?',
          alertId: 'alert-001',
          userRole: 'Analyst'
        })
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when API request fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to get AI response. Please try again.',
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
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to get AI response. Please try again.',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/chat history/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      expect(input).toHaveAttribute('type', 'text');
      expect(sendButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Message Persistence', () => {
    it('maintains chat history when component re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      const input = screen.getByPlaceholderText(/ask me about this incident/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'First message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
      });

      rerender(<AIAssistantPanel alertId="alert-001" userRole="Analyst" />);

      expect(screen.getByText('First message')).toBeInTheDocument();
    });
  });
});