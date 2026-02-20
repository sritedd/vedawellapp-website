/**
 * Unit Tests for ProjectOverview Component
 */

import { render, waitFor } from '@testing-library/react';
import ProjectOverview from '@/components/guardian/ProjectOverview';

// Mock Supabase with complete chain
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () => Promise.resolve({ data: [], error: null }),
                    single: () => Promise.resolve({ data: null, error: null }),
                    order: () => Promise.resolve({ data: [], error: null })
                })
            })
        })
    })
}));

// Mock formatMoney
jest.mock('@/utils/format', () => ({
    formatMoney: (val: number) => `$${val?.toLocaleString() ?? '0'}`
}));

const mockProject = {
    id: 'proj-1',
    user_id: 'user-1',
    name: 'Test Project',
    address: '123 Test St',
    builder_name: 'Test Builder',
    contract_value: 500000,
    start_date: '2025-01-01',
    status: 'active' as const,
    created_at: '2025-01-01',
};

describe('ProjectOverview', () => {
    it('renders without crashing', async () => {
        const { container } = render(<ProjectOverview project={mockProject} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });

    it('handles project with minimal fields', async () => {
        const minimalProject = {
            id: 'proj-1',
            user_id: 'user-1',
            name: 'Test',
            builder_name: '',
            contract_value: 0,
            address: '',
            start_date: '',
            status: 'planning' as const,
            created_at: '2025-01-01',
        };
        const { container } = render(<ProjectOverview project={minimalProject} />);
        await waitFor(() => {
            expect(container.firstChild).toBeTruthy();
        });
    });
});
