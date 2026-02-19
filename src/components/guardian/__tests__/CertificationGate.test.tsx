/**
 * Unit Tests for CertificationGate Component
 */

import { render, waitFor } from '@testing-library/react';
import CertificationGate from '@/components/guardian/CertificationGate';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null })
                })
            }),
            insert: () => Promise.resolve({ error: null }),
            upsert: () => Promise.resolve({ error: null })
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
    currentStage: 'frame',
};

describe('CertificationGate', () => {
    it('renders without crashing', async () => {
        const { container } = render(<CertificationGate {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty currentStage', async () => {
        const { container } = render(<CertificationGate projectId="proj-1" currentStage="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles different stages', async () => {
        const stages = ['slab', 'frame', 'lockup', 'fixing'];
        for (const stage of stages) {
            const { container, unmount } = render(<CertificationGate projectId="proj-1" currentStage={stage} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
            unmount();
        }
    });
});
