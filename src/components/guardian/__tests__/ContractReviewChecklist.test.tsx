/**
 * Unit Tests for ContractReviewChecklist Component
 */

import { render } from '@testing-library/react';
import ContractReviewChecklist from '@/components/guardian/ContractReviewChecklist';

const defaultProps = {
    projectId: 'proj-1',
};

describe('ContractReviewChecklist', () => {
    it('renders without crashing', () => {
        const { container } = render(<ContractReviewChecklist {...defaultProps} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles empty projectId', () => {
        const { container } = render(<ContractReviewChecklist projectId="" />);
        expect(container.firstChild).toBeTruthy();
    });
});
