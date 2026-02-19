/**
 * Unit Tests for WeeklyCheckIn Component
 */

import { render, waitFor } from '@testing-library/react';
import WeeklyCheckIn from '@/components/guardian/WeeklyCheckIn';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: null }),
                    single: () => Promise.resolve({ data: null, error: null })
                })
            }),
            insert: () => Promise.resolve({ error: null })
        })
    })
}));

const defaultProps = {
    projectId: 'proj-1',
};

describe('WeeklyCheckIn', () => {
    it('renders without crashing', async () => {
        const { container } = render(<WeeklyCheckIn {...defaultProps} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles empty projectId', async () => {
        const { container } = render(<WeeklyCheckIn projectId="" />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
