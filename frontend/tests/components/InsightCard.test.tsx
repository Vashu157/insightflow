import { render, screen } from '@testing-library/react';
import InsightCard from '@/components/analyst/InsightCard';

describe('InsightCard Component', () => {
  it('renders insight properties correctly', () => {
    const mockInsight = {
      title: 'High Revenue Growth',
      category: 'Performance',
      description: 'Revenue grew by 20% in Q3',
      supporting_evidence: 'Historical sales data',
      confidence: 'High',
      suggested_next_action: 'Investigate marketing ROI',
      severity: 'Info'
    };

    render(<InsightCard insight={mockInsight} />);
    
    expect(screen.getByText('High Revenue Growth')).toBeInTheDocument();
    expect(screen.getByText('Revenue grew by 20% in Q3')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Historical sales data')).toBeInTheDocument();
    expect(screen.getByText('Investigate marketing ROI')).toBeInTheDocument();
  });
});
