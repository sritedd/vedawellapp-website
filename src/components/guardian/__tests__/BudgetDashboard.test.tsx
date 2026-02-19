/**
 * Unit Tests for BudgetDashboard Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import BudgetDashboard from '@/components/guardian/BudgetDashboard';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                    single: () => Promise.resolve({ data: null, error: null })
                })
            })
        })
    })
}));

const defaultProps = {
    projectId: 'proj-1',
    contractValue: 500000,
};

describe('BudgetDashboard', () => {
    it('renders without crashing', async () => {
        const { container } = render(<BudgetDashboard {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles zero contract value', async () => {
        const { container } = render(<BudgetDashboard projectId="proj-1" contractValue={0} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<BudgetDashboard projectId="" contractValue={500000} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
