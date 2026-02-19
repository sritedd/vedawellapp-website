/**
 * Unit Tests for WarrantyCalculator Component
 */

import { render } from '@testing-library/react';
import WarrantyCalculator from '@/components/guardian/WarrantyCalculator';

const defaultProps = {
    completionDate: '2025-01-01',
};

describe('WarrantyCalculator', () => {
    it('renders without crashing', () => {
        const { container } = render(<WarrantyCalculator {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles empty completionDate', () => {
        const { container } = render(<WarrantyCalculator completionDate="" />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles future dates', () => {
        const { container } = render(<WarrantyCalculator completionDate="2030-12-31" />);
        expect(container.firstChild).toBeTruthy();
    });
});
