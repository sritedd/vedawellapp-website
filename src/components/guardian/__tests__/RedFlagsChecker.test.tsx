/**
 * Unit Tests for RedFlagsChecker Component
 */

import { render } from '@testing-library/react';
import RedFlagsChecker from '@/components/guardian/RedFlagsChecker';

const defaultProps = {
    phase: 'preContract' as const,
};

describe('RedFlagsChecker', () => {
    it('renders without crashing', () => {
        const { container } = render(<RedFlagsChecker {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles different phases', () => {
        const phases = ['preContract', 'duringConstruction', 'atHandover'] as const;
        phases.forEach(phase => {
            const { container, unmount } = render(<RedFlagsChecker phase={phase} />);
            expect(container.firstChild).toBeTruthy();
            unmount();
        });
    });
});
