/**
 * Unit Tests for PreHandoverChecklist Component
 * NOTE: Only has optional onComplete prop
 */

import { render } from '@testing-library/react';
import PreHandoverChecklist from '@/components/guardian/PreHandoverChecklist';

describe('PreHandoverChecklist', () => {
    it('renders without crashing', () => {
        const { container } = render(<PreHandoverChecklist />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles onComplete callback', () => {
        const onComplete = jest.fn();
        const { container } = render(<PreHandoverChecklist onComplete={onComplete} />);
        expect(container.firstChild).toBeTruthy();
    });
});
