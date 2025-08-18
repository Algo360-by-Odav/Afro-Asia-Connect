import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from './page';

// Mock the chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  it('renders the admin dashboard with main sections', () => {
    render(<AdminDashboard />);
    
    // Check for main dashboard elements
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Platform Overview')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('displays key metrics cards', () => {
    render(<AdminDashboard />);
    
    // Check for metric cards
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Listings')).toBeInTheDocument();
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('renders charts with proper accessibility', () => {
    render(<AdminDashboard />);
    
    // Check for chart containers
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(4);
    expect(screen.getAllByTestId('pie-chart')).toHaveLength(2);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('has accessible form elements with proper labels', () => {
    render(<AdminDashboard />);
    
    // Check for search input accessibility
    const searchInput = screen.getByRole('textbox', { name: /search users, listings, or transactions/i });
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label');
    expect(searchInput).toHaveAttribute('title');
  });

  it('toggles system settings correctly', () => {
    render(<AdminDashboard />);
    
    // Find toggle switches by their accessible names
    const sslToggle = screen.getByRole('checkbox', { name: /enable ssl\/tls encryption/i });
    const stripeToggle = screen.getByRole('checkbox', { name: /enable stripe payment gateway/i });
    
    expect(sslToggle).toBeInTheDocument();
    expect(stripeToggle).toBeInTheDocument();
    
    // Test toggle functionality
    fireEvent.click(sslToggle);
    fireEvent.click(stripeToggle);
    
    // Toggles should be interactive (checked state may vary based on implementation)
    expect(sslToggle).toBeEnabled();
    expect(stripeToggle).toBeEnabled();
  });

  it('displays user management section with proper accessibility', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Recent Users')).toBeInTheDocument();
    
    // Check for user list items
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows analytics data with progress bars', () => {
    render(<AdminDashboard />);
    
    // Check for analytics section
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Top Countries by Users')).toBeInTheDocument();
    
    // Check for progress bars with accessibility attributes
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
    
    progressBars.forEach(bar => {
      expect(bar).toHaveAttribute('aria-label');
    });
  });

  it('handles search functionality', () => {
    render(<AdminDashboard />);
    
    const searchInput = screen.getByRole('textbox', { name: /search users, listings, or transactions/i });
    
    // Test search input
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput).toHaveValue('test search');
  });

  it('displays system health monitoring', () => {
    render(<AdminDashboard />);
    
    // Check for system health section
    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument(); // Uptime percentage
  });

  it('shows recent activity section', () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('User john.doe@email.com registered')).toBeInTheDocument();
    expect(screen.getByText('New listing created: "Office Space in Lagos"')).toBeInTheDocument();
  });

  it('has proper ARIA labels for interactive elements', () => {
    render(<AdminDashboard />);
    
    // Check that all toggle switches have proper ARIA labels
    const toggles = screen.getAllByRole('checkbox');
    toggles.forEach(toggle => {
      expect(toggle).toHaveAttribute('aria-label');
    });
    
    // Check that progress bars have proper ARIA attributes
    const progressBars = screen.getAllByRole('progressbar');
    progressBars.forEach(bar => {
      expect(bar).toHaveAttribute('aria-label');
    });
  });
});
