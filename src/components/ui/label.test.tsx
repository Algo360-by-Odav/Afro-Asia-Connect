import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Label } from './label';

describe('Label Component', () => {
  it('renders with text content', () => {
    render(<Label>Test Label</Label>);
    
    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('applies custom className', () => {
    render(<Label className="custom-class">Custom Label</Label>);
    
    const label = screen.getByText('Custom Label');
    expect(label).toHaveClass('custom-class');
  });

  it('forwards htmlFor prop', () => {
    render(<Label htmlFor="test-input">Input Label</Label>);
    
    const label = screen.getByText('Input Label');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('forwards additional props', () => {
    render(<Label data-testid="test-label">Test Label</Label>);
    
    const label = screen.getByTestId('test-label');
    expect(label).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Label htmlFor="input-id">Accessible Label</Label>);
    
    const label = screen.getByText('Accessible Label');
    expect(label).toHaveAttribute('for', 'input-id');
  });
});
