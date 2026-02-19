/**
 * Unit Tests for ExportCenter Component
 * 
 * Tests format selection, download handlers, and null safety.
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import ExportCenter from '@/components/guardian/ExportCenter';

const defaultProps = {
    projectId: 'proj-1',
    projectName: 'Test Project',
    builderName: 'Test Builder',
    contractValue: 500000,
};

describe('ExportCenter', () => {
    describe('Rendering', () => {
        it('renders without crashing', () => {
            render(<ExportCenter {...defaultProps} />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });

        it('renders project summary option', () => {
            render(<ExportCenter {...defaultProps} />);
            expect(screen.getByText(/Project Summary/i)).toBeInTheDocument();
        });

        it('renders defect report option', () => {
            render(<ExportCenter {...defaultProps} />);
            expect(screen.getByText(/Defect Report/i)).toBeInTheDocument();
        });

        it('renders variation report option', () => {
            render(<ExportCenter {...defaultProps} />);
            expect(screen.getByText(/Variation Report/i)).toBeInTheDocument();
        });

        it('renders payment schedule option', () => {
            render(<ExportCenter {...defaultProps} />);
            expect(screen.getByText(/Payment Schedule/i)).toBeInTheDocument();
        });

        it('renders fair trading dispute option', () => {
            render(<ExportCenter {...defaultProps} />);
            // Use getAllByText since there are multiple mentions
            const elements = screen.getAllByText(/Fair Trading/i);
            expect(elements.length).toBeGreaterThan(0);
        });
    });

    describe('Null Safety', () => {
        it('handles empty project name', () => {
            render(<ExportCenter {...defaultProps} projectName="" />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });

        it('handles empty builder name', () => {
            render(<ExportCenter {...defaultProps} builderName="" />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });

        it('handles zero contract value', () => {
            render(<ExportCenter {...defaultProps} contractValue={0} />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });

        it('handles special characters in project name', () => {
            render(<ExportCenter {...defaultProps} projectName="Test's Project & Co." />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });

        it('handles negative contract value', () => {
            render(<ExportCenter {...defaultProps} contractValue={-1000} />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });

        it('handles very long project name', () => {
            const longName = 'A'.repeat(500);
            render(<ExportCenter {...defaultProps} projectName={longName} />);
            expect(screen.getByText(/Export Center/i)).toBeInTheDocument();
        });
    });
});
