/**
 * Comprehensive Unit Tests for ProjectDefects Component
 * 
 * Tests cover:
 * - Rendering with various data states
 * - Severity levels display
 * - Status display
 * - Location and notes display
 * - Edge cases and null safety
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ProjectDefects from '@/components/guardian/ProjectDefects';

const defaultProps = {
    projectId: 'proj-1',
};

describe('ProjectDefects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ======================
    // RENDERING TESTS
    // ======================
    describe('Rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(<ProjectDefects {...defaultProps} />);
            expect(container.firstChild).toBeTruthy();
        });

        it('displays component content', () => {
            const { container } = render(<ProjectDefects {...defaultProps} />);
            expect(container.textContent).toBeTruthy();
        });

        it('has interactive buttons', () => {
            render(<ProjectDefects {...defaultProps} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('displays sample defects from initial data', () => {
            render(<ProjectDefects {...defaultProps} />);
            expect(screen.getByText(/Cracked tile/i)).toBeInTheDocument();
        });

        it('displays Paint peeling defect', () => {
            render(<ProjectDefects {...defaultProps} />);
            expect(screen.getByText(/Paint peeling/i)).toBeInTheDocument();
        });

        it('displays Door not closing defect', () => {
            render(<ProjectDefects {...defaultProps} />);
            expect(screen.getByText(/Door not closing/i)).toBeInTheDocument();
        });
    });

    // ======================
    // SEVERITY TESTS
    // ======================
    describe('Severity Levels', () => {
        it('displays major severity elements', () => {
            render(<ProjectDefects {...defaultProps} />);
            const majorElements = screen.getAllByText(/major/i);
            expect(majorElements.length).toBeGreaterThan(0);
        });

        it('displays minor severity elements', () => {
            render(<ProjectDefects {...defaultProps} />);
            const minorElements = screen.getAllByText(/minor/i);
            expect(minorElements.length).toBeGreaterThan(0);
        });

        it('displays cosmetic severity elements', () => {
            render(<ProjectDefects {...defaultProps} />);
            const cosmeticElements = screen.getAllByText(/cosmetic/i);
            expect(cosmeticElements.length).toBeGreaterThan(0);
        });
    });

    // ======================
    // STATUS TESTS
    // ======================
    describe('Status Display', () => {
        it('displays open status elements', () => {
            render(<ProjectDefects {...defaultProps} />);
            const openElements = screen.getAllByText(/open/i);
            expect(openElements.length).toBeGreaterThan(0);
        });

        it('displays reported status elements', () => {
            render(<ProjectDefects {...defaultProps} />);
            const reportedElements = screen.getAllByText(/reported/i);
            expect(reportedElements.length).toBeGreaterThan(0);
        });

        it('displays in progress status elements', () => {
            render(<ProjectDefects {...defaultProps} />);
            const progressElements = screen.getAllByText(/in progress/i);
            expect(progressElements.length).toBeGreaterThan(0);
        });
    });

    // ======================
    // LOCATION TESTS
    // ======================
    describe('Location Display', () => {
        it('displays Master Ensuite location', () => {
            render(<ProjectDefects {...defaultProps} />);
            const elements = screen.getAllByText(/Master Ensuite/i);
            expect(elements.length).toBeGreaterThan(0);
        });

        it('displays Garage location', () => {
            render(<ProjectDefects {...defaultProps} />);
            const elements = screen.getAllByText(/Garage/i);
            expect(elements.length).toBeGreaterThan(0);
        });

        it('displays Bedroom 2 location', () => {
            render(<ProjectDefects {...defaultProps} />);
            const elements = screen.getAllByText(/Bedroom 2/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    // ======================
    // NOTES TESTS
    // ======================
    describe('Notes Display', () => {
        it('displays builder notes', () => {
            render(<ProjectDefects {...defaultProps} />);
            expect(screen.getByText(/Carpenter scheduled/i)).toBeInTheDocument();
        });

        it('displays homeowner notes', () => {
            render(<ProjectDefects {...defaultProps} />);
            expect(screen.getByText(/Noticed during inspection/i)).toBeInTheDocument();
        });
    });

    // ======================
    // INTERACTION TESTS
    // ======================
    describe('User Interactions', () => {
        it('has clickable buttons', () => {
            render(<ProjectDefects {...defaultProps} />);
            const buttons = screen.getAllByRole('button');
            fireEvent.click(buttons[0]);
            // Should not crash
        });
    });

    // ======================
    // NULL SAFETY TESTS
    // ======================
    describe('Null Safety', () => {
        it('handles empty projectId', () => {
            const { container } = render(<ProjectDefects projectId="" />);
            expect(container.firstChild).toBeTruthy();
        });

        it('renders with required props only', () => {
            const { container } = render(<ProjectDefects projectId="test" />);
            expect(container.firstChild).toBeTruthy();
        });
    });

    // ======================
    // STAGE TESTS
    // ======================
    describe('Stage Display', () => {
        it('displays Fixing stage', () => {
            render(<ProjectDefects {...defaultProps} />);
            const fixingElements = screen.getAllByText(/Fixing/i);
            expect(fixingElements.length).toBeGreaterThan(0);
        });

        it('displays Practical Completion stage', () => {
            render(<ProjectDefects {...defaultProps} />);
            expect(screen.getByText(/Practical Completion/i)).toBeInTheDocument();
        });
    });

    // ======================
    // DATE TESTS
    // ======================
    describe('Date Display', () => {
        it('shows date information in the component', () => {
            render(<ProjectDefects {...defaultProps} />);
            const dateElements = screen.getAllByText(/2025/);
            expect(dateElements.length).toBeGreaterThan(0);
        });
    });
});
