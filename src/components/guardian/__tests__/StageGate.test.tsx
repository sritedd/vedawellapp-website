/**
 * Comprehensive Unit Tests for StageGate Component
 * 
 * Tests cover:
 * - Rendering with various stages
 * - Requirement categories
 * - Stage changes
 * - Edge cases and null safety
 */

import { render, screen } from '@testing-library/react';
import StageGate from '@/components/guardian/StageGate';

const defaultProps = {
    projectId: 'proj-1',
    currentStage: 'frame',
    nextStage: 'lockup',
};

describe('StageGate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ======================
    // RENDERING TESTS
    // ======================
    describe('Rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(<StageGate {...defaultProps} />);
            expect(container.firstChild).toBeTruthy();
        });

        it('displays stage content', () => {
            const { container } = render(<StageGate {...defaultProps} />);
            expect(container.textContent).toBeTruthy();
        });

        it('has interactive elements', () => {
            render(<StageGate {...defaultProps} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    // ======================
    // STAGE TESTS
    // ======================
    describe('Stage Configuration', () => {
        it('renders slab stage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="slab" nextStage="frame" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('renders frame stage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="frame" nextStage="lockup" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('renders lockup stage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="lockup" nextStage="fixing" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('renders fixing stage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="fixing" nextStage="pc" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('renders PC stage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="pc" nextStage="" />);
            expect(container.firstChild).toBeTruthy();
        });
    });

    // ======================
    // REQUIREMENT DISPLAY TESTS
    // ======================
    describe('Requirements Display', () => {
        it('shows inspection requirements text', () => {
            render(<StageGate projectId="proj-1" currentStage="frame" nextStage="lockup" />);
            const inspectionElements = screen.getAllByText(/inspection/i);
            expect(inspectionElements.length).toBeGreaterThan(0);
        });

        it('shows certificate requirements text', () => {
            render(<StageGate projectId="proj-1" currentStage="frame" nextStage="lockup" />);
            const certElements = screen.getAllByText(/certificate/i);
            expect(certElements.length).toBeGreaterThan(0);
        });

        it('shows defect requirements text', () => {
            render(<StageGate projectId="proj-1" currentStage="frame" nextStage="lockup" />);
            const defectElements = screen.getAllByText(/defect/i);
            expect(defectElements.length).toBeGreaterThan(0);
        });
    });

    // ======================
    // FRAME STAGE SPECIFIC TESTS
    // ======================
    describe('Frame Stage Requirements', () => {
        it('shows frame inspection', () => {
            render(<StageGate projectId="proj-1" currentStage="frame" nextStage="lockup" />);
            expect(screen.getByText(/Frame inspection/i)).toBeInTheDocument();
        });

        it('shows termite treatment', () => {
            render(<StageGate projectId="proj-1" currentStage="frame" nextStage="lockup" />);
            expect(screen.getByText(/Termite/i)).toBeInTheDocument();
        });
    });

    // ======================
    // PC STAGE SPECIFIC TESTS
    // ======================
    describe('Practical Completion Stage', () => {
        it('shows Occupation Certificate', () => {
            render(<StageGate projectId="proj-1" currentStage="pc" nextStage="" />);
            const ocElements = screen.getAllByText(/Occupation Certificate/i);
            expect(ocElements.length).toBeGreaterThan(0);
        });

        it('shows smoke alarm', () => {
            render(<StageGate projectId="proj-1" currentStage="pc" nextStage="" />);
            expect(screen.getByText(/Smoke alarm/i)).toBeInTheDocument();
        });
    });

    // ======================
    // NULL SAFETY TESTS
    // ======================
    describe('Null Safety', () => {
        it('handles empty currentStage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="" nextStage="frame" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('handles empty nextStage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="pc" nextStage="" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('handles empty projectId', () => {
            const { container } = render(<StageGate projectId="" currentStage="frame" nextStage="lockup" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('handles unknown stage', () => {
            const { container } = render(<StageGate projectId="proj-1" currentStage="unknown" nextStage="frame" />);
            expect(container.firstChild).toBeTruthy();
        });
    });

    // ======================
    // CALLBACK TESTS
    // ======================
    describe('Callbacks', () => {
        it('handles missing onProceed callback', () => {
            const { container } = render(<StageGate {...defaultProps} />);
            expect(container.firstChild).toBeTruthy();
        });

        it('accepts onProceed callback', () => {
            const onProceed = jest.fn();
            const { container } = render(<StageGate {...defaultProps} onProceed={onProceed} />);
            expect(container.firstChild).toBeTruthy();
        });
    });

    // ======================
    // EDGE CASES
    // ======================
    describe('Edge Cases', () => {
        it('handles all stages', () => {
            const stages = ['slab', 'frame', 'lockup', 'fixing', 'pc'];
            stages.forEach(stage => {
                const { container, unmount } = render(
                    <StageGate projectId="proj-1" currentStage={stage} nextStage="" />
                );
                expect(container.firstChild).toBeTruthy();
                unmount();
            });
        });

        it('renders with all props', () => {
            const { container } = render(
                <StageGate
                    projectId="proj-1"
                    currentStage="frame"
                    nextStage="lockup"
                    onProceed={() => { }}
                />
            );
            expect(container.firstChild).toBeTruthy();
        });
    });
});
