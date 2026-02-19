/**
 * Unit Tests for SiteVisitLog Component
 */

import { render, waitFor } from '@testing-library/react';
import SiteVisitLog from '@/components/guardian/SiteVisitLog';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null })
                })
            }),
            insert: () => Promise.resolve({ error: null })
        })
    })
}));

const defaultProps = {
    projectId: 'proj-1',
};

describe('SiteVisitLog', () => {
    it('renders without crashing', async () => {
        const { container } = render(<SiteVisitLog {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<SiteVisitLog projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
