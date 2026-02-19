/**
 * Unit Tests for CommunicationLog Component
 */

import { render, waitFor } from '@testing-library/react';
import CommunicationLog from '@/components/guardian/CommunicationLog';

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

describe('CommunicationLog', () => {
    it('renders without crashing', async () => {
        const { container } = render(<CommunicationLog {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<CommunicationLog projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
