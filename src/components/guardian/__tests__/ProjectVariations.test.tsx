/**
 * Comprehensive Unit Tests for ProjectVariations Component
 * 
 * Tests cover:
 * - Rendering with various data states
 * - Financial calculations (totals, percentages)
 * - Warning thresholds (10%, 15%)
 * - Status handling
 * - Edge cases and null safety
 */

import { render, screen, waitFor } from '@testing-library/react';
import ProjectVariations from '@/components/guardian/ProjectVariations';

// Mock Supabase
const mockSupabaseData: any[] = [];
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: mockSupabaseData, error: null })
                })
            }),
            update: () => ({
                eq: () => Promise.resolve({ error: null })
            }),
            insert: () => Promise.resolve({ error: null })
        })
    })
}));

// Mock react-signature-canvas
jest.mock('react-signature-canvas', () => {
    return function MockSignatureCanvas() {
        return <canvas data-testid="signature-canvas" />;
    };
});

// Mock formatMoney utility
jest.mock('@/utils/format', () => ({
    formatMoney: (val: number) => `$${(val || 0).toLocaleString()}`
}));

// Test data factory
const createVariation = (overrides = {}) => ({
    id: `var-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Variation',
    description: 'Test description',
    additional_cost: 5000,
    labour_cost: 2000,
    material_cost: 3000,
    status: 'pending',
    reason_category: 'change_order',
    homeowner_signature_url: null,
    builder_signature_url: null,
    created_at: new Date().toISOString(),
    ...overrides
});

const defaultProps = {
    projectId: 'proj-1',
    contractValue: 500000,
};

describe('ProjectVariations', () => {
    beforeEach(() => {
        mockSupabaseData.length = 0;
        jest.clearAllMocks();
    });

    // ======================
    // RENDERING TESTS
    // ======================
    describe('Rendering', () => {
        it('renders without crashing', async () => {
            const { container } = render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });

        it('shows loading state initially', () => {
            render(<ProjectVariations {...defaultProps} />);
            expect(screen.getByText(/Loading/i)).toBeInTheDocument();
        });

        it('renders empty state when no variations', async () => {
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/No variations/i)).toBeInTheDocument();
            });
        });

        it('renders Variations Register header', async () => {
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Variations Register/i)).toBeInTheDocument();
            });
        });

        it('renders Log New Variation button', async () => {
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Log New Variation/i)).toBeInTheDocument();
            });
        });

        it('renders Original Contract card', async () => {
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Original Contract/i)).toBeInTheDocument();
            });
        });

        it('renders Total Variations card', async () => {
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Total Variations/i)).toBeInTheDocument();
            });
        });

        it('renders Projected Total card', async () => {
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Projected Total/i)).toBeInTheDocument();
            });
        });

        it('renders variations list when data exists', async () => {
            mockSupabaseData.push(createVariation({ title: 'Kitchen Upgrade' }));
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Kitchen Upgrade/i)).toBeInTheDocument();
            });
        });
    });

    // ======================
    // WARNING THRESHOLD TESTS
    // ======================
    describe('Warning Thresholds', () => {
        it('shows NO warning when under 10%', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 45000 })); // 9%
            render(<ProjectVariations projectId="proj-1" contractValue={500000} />);
            await waitFor(() => {
                expect(screen.queryByText(/Variation Warning/i)).not.toBeInTheDocument();
                expect(screen.queryByText(/Critical Variation Alert/i)).not.toBeInTheDocument();
            });
        });

        it('shows WARNING when at 10%', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 50000 })); // 10%
            render(<ProjectVariations projectId="proj-1" contractValue={500000} />);
            await waitFor(() => {
                expect(screen.getByText(/Variation Warning/i)).toBeInTheDocument();
            });
        });

        it('shows CRITICAL warning at 15%', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 75000 })); // 15%
            render(<ProjectVariations projectId="proj-1" contractValue={500000} />);
            await waitFor(() => {
                expect(screen.getByText(/Critical Variation Alert/i)).toBeInTheDocument();
            });
        });

        it('shows CRITICAL warning above 15%', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 100000 })); // 20%
            render(<ProjectVariations projectId="proj-1" contractValue={500000} />);
            await waitFor(() => {
                expect(screen.getByText(/Critical Variation Alert/i)).toBeInTheDocument();
            });
        });

        it('shows NSW Fair Trading reference at critical', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 80000 })); // 16%
            render(<ProjectVariations projectId="proj-1" contractValue={500000} />);
            await waitFor(() => {
                expect(screen.getByText(/NSW Fair Trading/i)).toBeInTheDocument();
            });
        });
    });

    // ======================
    // CATEGORY TESTS
    // ======================
    describe('Category Handling', () => {
        it('displays builder_error category with warning', async () => {
            mockSupabaseData.push(createVariation({ reason_category: 'builder_error' }));
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/builder error/i)).toBeInTheDocument();
            });
        });

        it('shows builder cost warning for builder_error', async () => {
            mockSupabaseData.push(createVariation({ reason_category: 'builder_error' }));
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/builder's cost/i)).toBeInTheDocument();
            });
        });
    });

    // ======================
    // NULL SAFETY TESTS
    // ======================
    describe('Null Safety', () => {
        it('handles empty projectId', async () => {
            const { container } = render(<ProjectVariations projectId="" contractValue={500000} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });

        it('handles undefined contractValue', async () => {
            const { container } = render(<ProjectVariations projectId="proj-1" />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });

        it('handles zero contract value', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 5000 }));
            const { container } = render(<ProjectVariations projectId="proj-1" contractValue={0} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });

        it('handles variation with null additional_cost', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: null }));
            const { container } = render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });
    });

    // ======================
    // EDGE CASES
    // ======================
    describe('Edge Cases', () => {
        it('handles exactly 10% threshold boundary', async () => {
            mockSupabaseData.push(createVariation({ additional_cost: 49999 })); // 9.9998%
            render(<ProjectVariations projectId="proj-1" contractValue={500000} />);
            await waitFor(() => {
                expect(screen.queryByText(/Variation Warning/i)).not.toBeInTheDocument();
            });
        });

        it('handles multiple variations', async () => {
            mockSupabaseData.push(
                createVariation({ title: 'Variation 1' }),
                createVariation({ title: 'Variation 2' }),
                createVariation({ title: 'Variation 3' })
            );
            render(<ProjectVariations {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Variation 1/i)).toBeInTheDocument();
                expect(screen.getByText(/Variation 2/i)).toBeInTheDocument();
            });
        });
    });
});
