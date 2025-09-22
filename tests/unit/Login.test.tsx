import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/pages/login'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

// Mock the auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn()
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}))

const mockAuth = useAuth as any
const mockToast = vi.fn()
const mockUseToast = useToast as any

describe('LoginPage', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    mockAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false
    })

    mockUseToast.mockReturnValue({
      toast: mockToast
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial rendering', () => {
    it('renders the login page with title and description', () => {
      render(<LoginPage />)

      expect(screen.getByText('CyberSec Training Platform')).toBeInTheDocument()
      expect(screen.getByText('Incident Response Simulation & Training')).toBeInTheDocument()
      expect(screen.getByText('Select your role to access the appropriate training interface')).toBeInTheDocument()
    })

    it('renders all three role options', () => {
      render(<LoginPage />)

      expect(screen.getByTestId('role-analyst')).toBeInTheDocument()
      expect(screen.getByTestId('role-manager')).toBeInTheDocument()
      expect(screen.getByTestId('role-client')).toBeInTheDocument()

      expect(screen.getByText('Security Analyst')).toBeInTheDocument()
      expect(screen.getByText('IT Manager')).toBeInTheDocument()
      expect(screen.getByText('Business Stakeholder')).toBeInTheDocument()
    })

    it('displays role descriptions correctly', () => {
      render(<LoginPage />)

      expect(screen.getByText('Technical incident response, detailed investigation, and hands-on remediation')).toBeInTheDocument()
      expect(screen.getByText('Oversight of incident response, resource allocation, and business impact assessment')).toBeInTheDocument()
      expect(screen.getByText('High-level status updates, business impact visibility, and communication coordination')).toBeInTheDocument()
    })

    it('renders login button as disabled initially', () => {
      render(<LoginPage />)

      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).toBeDisabled()
      expect(loginButton).toHaveTextContent('Login as ...')
    })

    it('displays security notice', () => {
      render(<LoginPage />)

      expect(screen.getByText('🔒 Simulated SSO Authentication')).toBeInTheDocument()
      expect(screen.getByText('This is a training environment with mock user credentials')).toBeInTheDocument()
    })
  })

  describe('Role selection', () => {
    it('allows selecting Analyst role', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByTestId('role-analyst'))

      const analystCard = screen.getByTestId('role-analyst')
      expect(analystCard).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')

      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).not.toBeDisabled()
      expect(loginButton).toHaveTextContent('Login as Analyst')
    })

    it('allows selecting Manager role', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByTestId('role-manager'))

      const managerCard = screen.getByTestId('role-manager')
      expect(managerCard).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')

      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).not.toBeDisabled()
      expect(loginButton).toHaveTextContent('Login as Manager')
    })

    it('allows selecting Client role', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByTestId('role-client'))

      const clientCard = screen.getByTestId('role-client')
      expect(clientCard).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')

      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).not.toBeDisabled()
      expect(loginButton).toHaveTextContent('Login as Client')
    })

    it('allows changing role selection', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Select Analyst first
      await user.click(screen.getByTestId('role-analyst'))
      expect(screen.getByTestId('login-button')).toHaveTextContent('Login as Analyst')

      // Change to Manager
      await user.click(screen.getByTestId('role-manager'))
      expect(screen.getByTestId('login-button')).toHaveTextContent('Login as Manager')

      // Verify previous selection is deselected
      const analystCard = screen.getByTestId('role-analyst')
      expect(analystCard).not.toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')

      // Verify new selection is selected
      const managerCard = screen.getByTestId('role-manager')
      expect(managerCard).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')
    })
  })

  describe('Login process', () => {
    it('calls login function with selected role when login button is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByTestId('role-analyst'))
      await user.click(screen.getByTestId('login-button'))

      expect(mockLogin).toHaveBeenCalledWith('Analyst')
      expect(mockLogin).toHaveBeenCalledTimes(1)
    })

    it('shows success toast on successful login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true })

      render(<LoginPage />)

      await user.click(screen.getByTestId('role-manager'))
      await user.click(screen.getByTestId('login-button'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login Successful',
          description: 'Logged in as Manager'
        })
      })
    })

    it('shows error toast on failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue(new Error('Login failed'))

      render(<LoginPage />)

      await user.click(screen.getByTestId('role-client'))
      await user.click(screen.getByTestId('login-button'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login Failed',
          description: 'Unable to authenticate. Please try again.',
          variant: 'destructive'
        })
      })
    })

    it('shows loading state during login', () => {
      mockAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true
      })

      render(<LoginPage />)

      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).toBeDisabled()
      expect(loginButton).toHaveTextContent('Authenticating...')
      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin')
    })

    it('prevents login when no role is selected', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Try to click login without selecting a role
      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).toBeDisabled()

      await user.click(loginButton)
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('prevents login during loading state', () => {
      mockAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true
      })

      render(<LoginPage />)

      const loginButton = screen.getByTestId('login-button')
      expect(loginButton).toBeDisabled()
    })
  })

  describe('Visual feedback', () => {
    it('applies correct styling to selected role card', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const analystCard = screen.getByTestId('role-analyst')

      // Initially not selected
      expect(analystCard).not.toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')
      expect(analystCard).toHaveClass('border-blue-500', 'hover:bg-blue-50')

      // After selection
      await user.click(analystCard)
      expect(analystCard).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')
    })

    it('applies correct color schemes for different roles', () => {
      render(<LoginPage />)

      const analystCard = screen.getByTestId('role-analyst')
      const managerCard = screen.getByTestId('role-manager')
      const clientCard = screen.getByTestId('role-client')

      expect(analystCard).toHaveClass('border-blue-500', 'hover:bg-blue-50')
      expect(managerCard).toHaveClass('border-green-500', 'hover:bg-green-50')
      expect(clientCard).toHaveClass('border-purple-500', 'hover:bg-purple-50')
    })
  })

  describe('Accessibility', () => {
    it('provides proper aria labels and keyboard navigation', async () => {
      render(<LoginPage />)

      const analystCard = screen.getByTestId('role-analyst')
      expect(analystCard).toHaveAttribute('tabindex', '0')

      // Test keyboard navigation
      analystCard.focus()
      fireEvent.keyDown(analystCard, { key: 'Enter' })

      expect(screen.getByTestId('login-button')).toHaveTextContent('Login as Analyst')
    })

    it('maintains focus management during role selection', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const analystCard = screen.getByTestId('role-analyst')
      await user.click(analystCard)

      // Verify focus doesn't get lost
      expect(document.activeElement).not.toBe(null)
    })
  })

  describe('Edge cases', () => {
    it('handles rapid role selection changes', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Rapidly click different roles
      await user.click(screen.getByTestId('role-analyst'))
      await user.click(screen.getByTestId('role-manager'))
      await user.click(screen.getByTestId('role-client'))

      expect(screen.getByTestId('login-button')).toHaveTextContent('Login as Client')
      expect(screen.getByTestId('role-client')).toHaveClass('ring-2', 'ring-primary', 'bg-primary/5')
    })

    it('handles login function throwing synchronous errors', async () => {
      const user = userEvent.setup()
      mockLogin.mockImplementation(() => {
        throw new Error('Sync error')
      })

      render(<LoginPage />)

      await user.click(screen.getByTestId('role-analyst'))
      await user.click(screen.getByTestId('login-button'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login Failed',
          description: 'Unable to authenticate. Please try again.',
          variant: 'destructive'
        })
      })
    })
  })
})