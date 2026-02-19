/**
 * Unit Tests for MaterialRegistry Component
 */

import { render, waitFor } from '@testing-library/react';
import MaterialRegistry from '@/components/guardian/MaterialRegistry';

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

describe('MaterialRegistry', () => {
    it('renders without crashing', async () => {
        const { container } = render(<MaterialRegistry {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<MaterialRegistry projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
