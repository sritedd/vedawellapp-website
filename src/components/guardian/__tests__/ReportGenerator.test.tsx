/**
 * Unit Tests for ReportGenerator Component
 * 
 * These tests ensure that report generation handles null/undefined values
 * gracefully, preventing runtime errors that would otherwise only be
 * caught during UAT.
 * 
 * Key Testing Scenarios:
 * 1. Empty arrays (no defects, no variations)
 * 2. Null/undefined field values
 * 3. Invalid date formats
 * 4. Edge cases (negative values, very long strings)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ReportGenerator from '@/components/guardian/ReportGenerator';

// Mock data factories
const createMockVariation = (overrides = {}) => ({
    id: 'var-1',
    title: 'Test Variation',
    description: 'Test description',
    additional_cost: 1000,
    status: 'pending',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

const createMockDefect = (overrides = {}) => ({
    id: 'def-1',
    title: 'Test Defect',
    description: 'Test description',
    severity: 'minor',
    status: 'open',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
});

const defaultProps = {
    projectId: 'proj-1',
    projectName: 'Test Project',
    builderName: 'Test Builder',
    contractValue: 500000,
    variations: [],
    defects: [],
};

describe('ReportGenerator', () => {
    describe('Rendering', () => {
        it('renders without crashing with empty arrays', () => {
            render(<ReportGenerator {...defaultProps} />);
            expect(screen.getByText('📊 Generate Reports')).toBeInTheDocument();
        });

        it('renders with populated variations and defects', () => {
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[createMockVariation()]}
                    defects={[createMockDefect()]}
                />
            );
            expect(screen.getByText(/1 variations/)).toBeInTheDocument();
            expect(screen.getByText(/1 defects/)).toBeInTheDocument();
        });
    });

    describe('Null-Safety: Variations', () => {
        it('handles variation with undefined title', () => {
            const variation = createMockVariation({ title: undefined });
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[variation]}
                />
            );
            const button = screen.getByText('Download Variations');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles variation with null status', () => {
            const variation = createMockVariation({ status: null });
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[variation]}
                />
            );
            const button = screen.getByText('Download Variations');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles variation with undefined additional_cost', () => {
            const variation = createMockVariation({ additional_cost: undefined });
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[variation]}
                />
            );
            expect(screen.getByText('Download Summary')).toBeInTheDocument();
        });

        it('handles variation with missing created_at', () => {
            const variation = createMockVariation({ created_at: undefined });
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[variation]}
                />
            );
            const button = screen.getByText('Download Variations');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });

    describe('Null-Safety: Defects', () => {
        it('handles defect with undefined severity', () => {
            const defect = createMockDefect({ severity: undefined });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            const button = screen.getByText('Download Defects');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles defect with null status', () => {
            const defect = createMockDefect({ status: null });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            const button = screen.getByText('Download Defects');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles defect with undefined title', () => {
            const defect = createMockDefect({ title: undefined });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            const button = screen.getByText('Download Defects');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles defect with missing description', () => {
            const defect = createMockDefect({ description: undefined });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            expect(screen.getByText('Download Defects')).toBeInTheDocument();
        });

        it('handles defect with invalid created_at', () => {
            const defect = createMockDefect({ created_at: 'not-a-date' });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            const button = screen.getByText('Download Defects');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });

    describe('Null-Safety: Summary Report', () => {
        it('generates summary with all null fields', () => {
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[createMockVariation({ status: null })]}
                    defects={[createMockDefect({ severity: null, status: null })]}
                />
            );
            const button = screen.getByText('Download Summary');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });

    describe('Null-Safety: Dispute Package', () => {
        it('generates dispute package with open defects having null severity', () => {
            const defect = createMockDefect({
                severity: undefined,
                status: 'open',
                title: undefined
            });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            const button = screen.getByText('Generate Dispute Package');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('generates dispute package with disputed variations having null fields', () => {
            const variation = createMockVariation({
                status: 'disputed',
                description: undefined,
                additional_cost: undefined,
            });
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[variation]}
                />
            );
            const button = screen.getByText('Generate Dispute Package');
            expect(() => fireEvent.click(button)).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('handles zero contract value', () => {
            render(
                <ReportGenerator
                    {...defaultProps}
                    contractValue={0}
                />
            );
            expect(screen.getByText('Download Summary')).toBeInTheDocument();
        });

        it('handles negative additional_cost', () => {
            const variation = createMockVariation({ additional_cost: -500 });
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={[variation]}
                />
            );
            const button = screen.getByText('Download Variations');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles very long project name', () => {
            const longName = 'A'.repeat(1000);
            render(
                <ReportGenerator
                    {...defaultProps}
                    projectName={longName}
                />
            );
            expect(screen.getByText('Download Summary')).toBeInTheDocument();
        });

        it('handles empty string values', () => {
            const defect = createMockDefect({
                title: '',
                description: '',
                severity: '',
                status: '',
            });
            render(
                <ReportGenerator
                    {...defaultProps}
                    defects={[defect]}
                />
            );
            const button = screen.getByText('Download Defects');
            expect(() => fireEvent.click(button)).not.toThrow();
        });

        it('handles mixed valid and invalid data', () => {
            const variations = [
                createMockVariation(),
                createMockVariation({ status: null, title: undefined }),
                createMockVariation({ additional_cost: null }),
            ];
            const defects = [
                createMockDefect(),
                createMockDefect({ severity: null, status: undefined }),
                createMockDefect({ created_at: null }),
            ];
            render(
                <ReportGenerator
                    {...defaultProps}
                    variations={variations}
                    defects={defects}
                />
            );
            // Verify component renders without crashing with mixed null/undefined data
            expect(screen.getByText('Download Summary')).toBeInTheDocument();
            expect(screen.getByText('Download Variations')).toBeInTheDocument();
            expect(screen.getByText('Download Defects')).toBeInTheDocument();
            expect(screen.getByText('Generate Dispute Package')).toBeInTheDocument();
        });
    });
});
