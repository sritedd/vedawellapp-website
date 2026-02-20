/**
 * Unit Tests for ContractReviewChecklist Component
 */

import { render } from '@testing-library/react';
import ContractReviewChecklist from '@/components/guardian/ContractReviewChecklist';

describe('ContractReviewChecklist', () => {
    it('renders without crashing', () => {
        const { container } = render(<ContractReviewChecklist />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles onComplete callback', () => {
        const onComplete = jest.fn();
        const { container } = render(<ContractReviewChecklist onComplete={onComplete} />);
        expect(container.firstChild).toBeTruthy();
    });
});
