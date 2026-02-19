/**
 * Unit Tests for DocumentVault Component
 */

import { render, waitFor } from '@testing-library/react';
import DocumentVault from '@/components/guardian/DocumentVault';

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
        }),
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } })
            })
        }
    })
}));

const defaultProps = {
    projectId: 'proj-1',
};

describe('DocumentVault', () => {
    it('renders without crashing', async () => {
        const { container } = render(<DocumentVault {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<DocumentVault projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
