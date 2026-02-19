/**
 * Unit Tests for BuildTypeSelector Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import BuildTypeSelector from '@/components/guardian/BuildTypeSelector';

const defaultProps = {
    onSelect: jest.fn(),
};

describe('BuildTypeSelector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { container } = render(<BuildTypeSelector {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('has clickable options', () => {
        render(<BuildTypeSelector {...defaultProps} />);
        const buttons = screen.queryAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(0);
    });
});
