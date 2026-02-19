/**
 * Unit Tests for ProjectChecklists Component
 */

import { render, waitFor } from '@testing-library/react';
import ProjectChecklists from '@/components/guardian/ProjectChecklists';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null })
                })
            })
        })
    })
}));

const defaultProps = {
    projectId: 'proj-1',
};

describe('ProjectChecklists', () => {
    it('renders without crashing', async () => {
        const { container } = render(<ProjectChecklists {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<ProjectChecklists projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
