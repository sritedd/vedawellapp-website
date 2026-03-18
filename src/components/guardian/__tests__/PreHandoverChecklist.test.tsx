/**
 * Unit Tests for PreHandoverChecklist Component
 * NOTE: Only has optional onDefectsCreated prop
 */

import { render } from '@testing-library/react';
import PreHandoverChecklist from '@/components/guardian/PreHandoverChecklist';

describe('PreHandoverChecklist', () => {
    it('renders without crashing', () => {
        const { container } = render(<PreHandoverChecklist />);
        expect(container.firstChild).toBeTruthy();
    });

    it('handles onDefectsCreated callback', () => {
        const onDefectsCreated = jest.fn();
        const { container } = render(<PreHandoverChecklist onDefectsCreated={onDefectsCreated} />);
        expect(container.firstChild).toBeTruthy();
    });
});
