import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarketInsightsPage from './page';

// Mock the chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('MarketInsightsPage', () => {
  it('renders the market insights page with main sections', () => {
    render(<MarketInsightsPage />);
    
    expect(screen.getByText('Market Insights')).toBeInTheDocument();
    expect(screen.getByText('Regional Analysis')).toBeInTheDocument();
    expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
  });

  it('displays regional market data with accessibility features', () => {
    render(<MarketInsightsPage />);
    
    // Check for regional data
    expect(screen.getByText('West Africa')).toBeInTheDocument();
    expect(screen.getByText('East Africa')).toBeInTheDocument();
    expect(screen.getByText('North Africa')).toBeInTheDocument();
    expect(screen.getByText('Southern Africa')).toBeInTheDocument();
  });

  it('has accessible progress bars for market demand and competition', () => {
    render(<MarketInsightsPage />);
    
    // Check for progress bars with proper accessibility
    const demandBars = screen.getAllByLabelText(/market demand:/i);
    const competitionBars = screen.getAllByLabelText(/competition level:/i);
    
    expect(demandBars.length).toBeGreaterThan(0);
    expect(competitionBars.length).toBeGreaterThan(0);
    
    // Verify accessibility attributes
    demandBars.forEach(bar => {
      expect(bar).toHaveAttribute('aria-label');
      expect(bar).toHaveAttribute('title');
    });
    
    competitionBars.forEach(bar => {
      expect(bar).toHaveAttribute('aria-label');
      expect(bar).toHaveAttribute('title');
    });
  });

  it('displays market demand and competition percentages', () => {
    render(<MarketInsightsPage />);
    
    // Check for percentage badges
    expect(screen.getByText('Demand: 78%')).toBeInTheDocument();
    expect(screen.getByText('Competition: 65%')).toBeInTheDocument();
    expect(screen.getByText('Demand: 82%')).toBeInTheDocument();
    expect(screen.getByText('Competition: 70%')).toBeInTheDocument();
  });

  it('renders charts with proper structure', () => {
    render(<MarketInsightsPage />);
    
    // Check for chart containers
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('shows trend analysis data', () => {
    render(<MarketInsightsPage />);
    
    expect(screen.getByText('Market Growth Trends')).toBeInTheDocument();
    expect(screen.getByText('Q1 2024')).toBeInTheDocument();
    expect(screen.getByText('Q2 2024')).toBeInTheDocument();
    expect(screen.getByText('Q3 2024')).toBeInTheDocument();
    expect(screen.getByText('Q4 2024')).toBeInTheDocument();
  });

  it('displays key insights and recommendations', () => {
    render(<MarketInsightsPage />);
    
    expect(screen.getByText('Key Insights')).toBeInTheDocument();
    expect(screen.getByText('East Africa shows the highest growth potential')).toBeInTheDocument();
    expect(screen.getByText('West Africa has strong market demand but high competition')).toBeInTheDocument();
  });
});
