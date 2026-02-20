/**
 * Unit Tests for WarrantyCalculator Component
 */

import { render } from '@testing-library/react';
import WarrantyCalculator from '@/components/guardian/WarrantyCalculator';

describe('WarrantyCalculator', () => {
    it('renders without crashing', () => {
        const { container } = render(<WarrantyCalculator handoverDate="2025-01-01" />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders without handoverDate', () => {
        const { container } = render(<WarrantyCalculator />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles future dates', () => {
        const { container } = render(<WarrantyCalculator handoverDate="2030-12-31" />);
        expect(container.firstChild).toBeTruthy();
    });
});
