/**
 * Unit Tests for ProgressPhotos Component
 */

import { render, waitFor } from '@testing-library/react';
import ProgressPhotos from '@/components/guardian/ProgressPhotos';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null })
                })
            })
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

describe('ProgressPhotos', () => {
    it('renders without crashing', async () => {
        const { container } = render(<ProgressPhotos {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<ProgressPhotos projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
