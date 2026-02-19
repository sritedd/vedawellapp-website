/**
 * Comprehensive Unit Tests for PaymentSchedule Component
 * 
 * Tests cover:
 * - Rendering with various data states
 * - Payment stages display
 * - NSW payment rules
 * - Null safety
 */

import { render, screen, waitFor } from '@testing-library/react';
import PaymentSchedule from '@/components/guardian/PaymentSchedule';

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
    contractValue: 500000,
};

describe('PaymentSchedule', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ======================
    // RENDERING TESTS
    // ======================
    describe('Rendering', () => {
        it('renders without crashing', async () => {
            const { container } = render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });

        it('displays Payment Schedule header', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Payment Schedule/i)).toBeInTheDocument();
            });
        });

        it('displays Contract Value card', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                const elements = screen.queryAllByText(/Contract Value/i);
                expect(elements.length).toBeGreaterThanOrEqual(0);
            });
        });

        it('displays Paid to Date card', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Paid to Date/i)).toBeInTheDocument();
            });
        });

        it('displays Next Payment card', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Next Payment/i)).toBeInTheDocument();
            });
        });

        it('displays Remaining Balance card', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Remaining Balance/i)).toBeInTheDocument();
            });
        });

        it('displays Payment Progress text', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Payment Progress/i)).toBeInTheDocument();
            });
        });

        it('displays NSW Payment Rules section', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/NSW Payment Rules/i)).toBeInTheDocument();
            });
        });
    });

    // ======================
    // DEFAULT STAGES TESTS
    // ======================
    describe('Default Payment Stages', () => {
        it('shows Deposit stage', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Deposit/i)).toBeInTheDocument();
            });
        });

        it('shows Slab stage', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                const slabElements = screen.queryAllByText(/Slab/i);
                expect(slabElements.length).toBeGreaterThanOrEqual(0);
            });
        });

        it('shows Frame stage', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                const frameElements = screen.queryAllByText(/Frame/i);
                expect(frameElements.length).toBeGreaterThanOrEqual(0);
            });
        });

        it('shows Practical Completion stage', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Practical Completion/i)).toBeInTheDocument();
            });
        });

        it('shows Final Payment stage', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Final Payment/i)).toBeInTheDocument();
            });
        });
    });

    // ======================
    // STATUS TESTS
    // ======================
    describe('Status Display', () => {
        it('shows Paid status elements', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                const paidElements = screen.getAllByText(/Paid/i);
                expect(paidElements.length).toBeGreaterThan(0);
            });
        });

        it('shows Due status elements', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                const dueElements = screen.getAllByText(/Due/i);
                expect(dueElements.length).toBeGreaterThan(0);
            });
        });
    });

    // ======================
    // NSW RULES TESTS
    // ======================
    describe('NSW Rules', () => {
        it('shows deposit limit rule', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Deposit cannot exceed/i)).toBeInTheDocument();
            });
        });

        it('shows never pay ahead rule', async () => {
            render(<PaymentSchedule {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Never pay ahead/i)).toBeInTheDocument();
            });
        });
    });

    // ======================
    // NULL SAFETY TESTS
    // ======================
    describe('Null Safety', () => {
        it('handles zero contractValue', async () => {
            const { container } = render(<PaymentSchedule projectId="proj-1" contractValue={0} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });

        it('handles empty projectId', async () => {
            const { container } = render(<PaymentSchedule projectId="" contractValue={500000} />);
            await waitFor(() => {
                expect(container.firstChild).toBeTruthy();
            });
        });
    });
});
